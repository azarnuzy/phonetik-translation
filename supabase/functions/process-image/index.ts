import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Headers":
		"authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY") ?? "";
const OPENROUTER_MODEL =
	Deno.env.get("OPENROUTER_MODEL") ?? "google/gemini-2.5-flash";

// Guardrail: each OpenRouter call spends real (if cheap) credits, so cap
// conversions per anonymous user per rolling 24h window.
const DAILY_LIMIT = 30;

const PROMPT = `You are an expert English phonetics transcriber embedded in an app called Phonetik.
You will be given a photo of a paragraph of English text (e.g. a page from a book).

Do all of the following:
1. Read (OCR) all the text visible in the image, exactly as written, preserving punctuation.
2. Split the text into short lines the way a reader would naturally pause: roughly one clause or short sentence per line, similar to line breaks in a poem reading.
3. For each line, produce a broad IPA phonetic transcription of its pronunciation in General American English, using standard IPA symbols and stress marks (e.g. ˈ for primary stress, ˌ for secondary stress), with words separated by single spaces.

Respond with ONLY strict JSON, no markdown code fences, no commentary, matching exactly this shape:
{"originalText": "the full OCR'd text as one string with original line breaks as \\n", "lines": [{"text": "line of original text", "ipa": "IPA transcription of that line"}]}`;

Deno.serve(async (req: Request) => {
	if (req.method === "OPTIONS") {
		return new Response("ok", { headers: corsHeaders });
	}

	if (req.method !== "POST") {
		return json({ error: "Method not allowed" }, 405);
	}

	try {
		const authHeader = req.headers.get("Authorization");
		if (!authHeader) {
			return json({ error: "Missing Authorization header" }, 401);
		}

		const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
			global: { headers: { Authorization: authHeader } },
		});

		const {
			data: { user },
			error: userError,
		} = await supabase.auth.getUser();

		if (userError || !user) {
			return json({ error: "Unauthorized" }, 401);
		}

		const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
		const { count, error: countError } = await supabase
			.from("conversions")
			.select("id", { count: "exact", head: true })
			.gte("created_at", since);

		if (countError) {
			console.error("count error", countError);
			return json({ error: "Failed to check usage" }, 500);
		}
		if ((count ?? 0) >= DAILY_LIMIT) {
			return json(
				{ error: "Daily conversion limit reached. Please try again tomorrow." },
				429,
			);
		}

		if (!OPENROUTER_API_KEY) {
			return json(
				{ error: "Server misconfigured: missing OpenRouter key" },
				500,
			);
		}

		const body = await req.json().catch(() => null);
		const imageBase64 = body?.imageBase64 as string | undefined;
		const mimeType = body?.mimeType as string | undefined;
		const language = (body?.language as string | undefined) ?? "en-US";

		if (!imageBase64 || !mimeType) {
			return json({ error: "imageBase64 and mimeType are required" }, 400);
		}

		const dataUrl = imageBase64.startsWith("data:")
			? imageBase64
			: `data:${mimeType};base64,${imageBase64}`;

		const orResponse = await fetch(
			"https://openrouter.ai/api/v1/chat/completions",
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${OPENROUTER_API_KEY}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					model: OPENROUTER_MODEL,
					response_format: { type: "json_object" },
					messages: [
						{
							role: "user",
							content: [
								{ type: "text", text: PROMPT },
								{ type: "image_url", image_url: { url: dataUrl } },
							],
						},
					],
				}),
			},
		);

		if (!orResponse.ok) {
			const errText = await orResponse.text();
			console.error("OpenRouter error", orResponse.status, errText);
			return json({ error: "OCR/phonetic conversion failed upstream" }, 502);
		}

		const orJson = await orResponse.json();
		const rawContent = orJson?.choices?.[0]?.message?.content;
		if (!rawContent || typeof rawContent !== "string") {
			return json({ error: "Empty response from model" }, 502);
		}

		let parsed: {
			originalText?: string;
			lines?: { text: string; ipa: string }[];
		};
		try {
			parsed = JSON.parse(rawContent);
		} catch {
			console.error("Model returned non-JSON content", rawContent);
			return json({ error: "Model returned invalid JSON" }, 502);
		}

		if (!parsed.originalText || !Array.isArray(parsed.lines)) {
			return json({ error: "Model returned an unexpected shape" }, 502);
		}

		const { error: insertError, data: inserted } = await supabase
			.from("conversions")
			.insert({
				user_id: user.id,
				language,
				original_text: parsed.originalText,
				ipa_lines: parsed.lines,
			})
			.select()
			.single();

		if (insertError) {
			console.error("insert error", insertError);
			return json({ error: "Failed to save conversion" }, 500);
		}

		return json({ conversion: inserted });
	} catch (err) {
		console.error(err);
		return json({ error: "Unexpected server error" }, 500);
	}
});

function json(body: unknown, status = 200) {
	return new Response(JSON.stringify(body), {
		status,
		headers: { ...corsHeaders, "Content-Type": "application/json" },
	});
}
