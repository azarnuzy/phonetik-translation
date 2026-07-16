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

const PHONEMIC_KEY = `Vowels & diphthongs (as in Longman's American English pronunciation key):
i (see), ɪ (sit), ɛ (ten), æ (cat), ɑ (father, hot), ɔ (law, dog), ʊ (put), u (too), ʌ (cup), ə (about), ər (teacher, bird), eɪ (day), aɪ (my), ɔɪ (boy), aʊ (how), oʊ (go)
Consonants: p, b, t, d, k, ɡ, tʃ, dʒ, f, v, θ, ð, s, z, ʃ, ʒ, h, m, n, ŋ, l, r, j, w`;

const PROMPT = `You are an expert English phonetics transcriber embedded in an app called Phonetik.
You will be given a photo of a paragraph of English text (e.g. a page from a book).

Do all of the following:
1. Read (OCR) all the text visible in the image, exactly as written, preserving punctuation.
2. Split the text into short lines the way a reader would naturally pause: roughly one clause or short sentence per line, similar to line breaks in a poem reading.
3. For each line, produce a broad IPA phonetic transcription of its pronunciation in General American English.

Use exactly the phonemic symbol set below (the same convention used by Longman's American English learner's dictionaries) and no others — do not use British symbols (ɒ, ɜː, ɐ), length marks (ː), or the rhotic-vowel ligatures ɝ/ɚ (write the r-colored central vowel as "ər" instead).

${PHONEMIC_KEY}

Stress marks: place ˈ immediately before a primary-stressed syllable and ˌ immediately before a secondary-stressed syllable, exactly as a pronunciation dictionary would (e.g. /ˈɔθəraɪz/, /ˌɔtəˈmætɪk/). Separate words with single spaces. Transcribe the same word the same way every time it recurs within the response.

Respond with ONLY strict JSON, no markdown code fences, no commentary, matching exactly this shape:
{"originalText": "the full OCR'd text as one string with original line breaks as \\n", "lines": [{"text": "line of original text", "ipa": "IPA transcription of that line"}]}`;

// The model occasionally returns non-JSON, truncated JSON, or a
// structurally-valid-but-empty payload (e.g. one line with a blank ipa).
// Retry a few times before giving up so a single bad generation doesn't
// surface as a hard failure to the user.
const MAX_MODEL_ATTEMPTS = 3;
const RETRY_DELAY_MS = 400;

interface ParsedConversion {
	originalText: string;
	lines: { text: string; ipa: string }[];
}

function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

// Some models wrap JSON in markdown code fences despite instructions not to.
function stripCodeFence(raw: string): string {
	const trimmed = raw.trim();
	const match = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
	return match ? match[1].trim() : trimmed;
}

// Some models still drift into British/dictionary-agnostic IPA despite the
// prompt's symbol table. Normalize the common deviations so output stays
// consistent with the Longman American English phonemic key.
function normalizeIpa(ipa: string): string {
	return ipa
		.replace(/[ɝɚ]/g, "ər")
		.replace(/ː/g, "")
		.replace(/ɒ/g, "ɑ")
		.replace(/ɐ/g, "ʌ")
		.replace(/ɜ/g, "ə");
}

function validateConversionShape(parsed: unknown): ParsedConversion | null {
	if (!parsed || typeof parsed !== "object") return null;
	const p = parsed as { originalText?: unknown; lines?: unknown };
	if (typeof p.originalText !== "string" || !p.originalText.trim()) {
		return null;
	}
	if (!Array.isArray(p.lines) || p.lines.length === 0) return null;

	const lines: { text: string; ipa: string }[] = [];
	for (const item of p.lines) {
		if (
			!item ||
			typeof item !== "object" ||
			typeof (item as { text?: unknown }).text !== "string" ||
			typeof (item as { ipa?: unknown }).ipa !== "string"
		) {
			return null;
		}
		const text = (item as { text: string }).text.trim();
		const ipa = normalizeIpa((item as { ipa: string }).ipa.trim());
		if (!text || !ipa) return null;
		lines.push({ text, ipa });
	}

	return { originalText: p.originalText, lines };
}

async function requestConversion(dataUrl: string): Promise<ParsedConversion> {
	let lastError = "Model returned invalid JSON";

	for (let attempt = 1; attempt <= MAX_MODEL_ATTEMPTS; attempt++) {
		let orResponse: Response;
		try {
			orResponse = await fetch(
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
		} catch (err) {
			console.error(`OpenRouter fetch failed (attempt ${attempt})`, err);
			lastError = "OCR/phonetic conversion failed upstream";
			await sleep(RETRY_DELAY_MS * attempt);
			continue;
		}

		if (!orResponse.ok) {
			const errText = await orResponse.text();
			console.error(
				`OpenRouter error (attempt ${attempt})`,
				orResponse.status,
				errText,
			);
			lastError = "OCR/phonetic conversion failed upstream";
			await sleep(RETRY_DELAY_MS * attempt);
			continue;
		}

		const orJson = await orResponse.json();
		const rawContent = orJson?.choices?.[0]?.message?.content;
		if (!rawContent || typeof rawContent !== "string") {
			console.error(`Empty response from model (attempt ${attempt})`);
			lastError = "Empty response from model";
			await sleep(RETRY_DELAY_MS * attempt);
			continue;
		}

		let parsed: unknown;
		try {
			parsed = JSON.parse(stripCodeFence(rawContent));
		} catch {
			console.error(
				`Model returned non-JSON content (attempt ${attempt})`,
				rawContent,
			);
			lastError = "Model returned invalid JSON";
			await sleep(RETRY_DELAY_MS * attempt);
			continue;
		}

		const validated = validateConversionShape(parsed);
		if (!validated) {
			console.error(
				`Model returned an unexpected/empty shape (attempt ${attempt})`,
				parsed,
			);
			lastError = "Model returned an unexpected shape";
			await sleep(RETRY_DELAY_MS * attempt);
			continue;
		}

		return validated;
	}

	throw new Error(lastError);
}

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

		let parsed: ParsedConversion;
		try {
			parsed = await requestConversion(dataUrl);
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "OCR/phonetic conversion failed";
			console.error(
				`requestConversion exhausted ${MAX_MODEL_ATTEMPTS} attempts:`,
				message,
			);
			return json({ error: message }, 502);
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
