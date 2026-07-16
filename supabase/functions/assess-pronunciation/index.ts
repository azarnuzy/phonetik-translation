import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Headers":
		"authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY") ?? "";
const GROQ_MODEL = Deno.env.get("GROQ_MODEL") ?? "whisper-large-v3-turbo";

// Guardrail: each transcription call spends real (if cheap/free-tier) quota,
// so cap attempts per user per rolling 24h window, same pattern as process-image.
const DAILY_LIMIT = 50;

const EXT_BY_MIME: Record<string, string> = {
	"audio/webm": "webm",
	"audio/ogg": "ogg",
	"audio/mp4": "m4a",
	"audio/mpeg": "mp3",
	"audio/wav": "wav",
};

interface WordResult {
	word: string;
	correct: boolean;
}

function tokenize(text: string): string[] {
	return text.trim().split(/\s+/).filter(Boolean);
}

function normalizeWord(word: string): string {
	return word.toLowerCase().replace(/[^\p{L}\p{N}']/gu, "");
}

// Aligns expected words against the transcribed words via LCS, so words the
// speaker actually said (in roughly the right order) count as correct even
// if the transcript has extra/missing/reordered words around them.
function alignWords(expected: string[], spoken: string[]): boolean[] {
	const a = expected.map(normalizeWord);
	const b = spoken.map(normalizeWord);
	const n = a.length;
	const m = b.length;

	const dp: number[][] = Array.from({ length: n + 1 }, () =>
		new Array(m + 1).fill(0),
	);
	for (let i = n - 1; i >= 0; i--) {
		for (let j = m - 1; j >= 0; j--) {
			dp[i][j] =
				a[i] && a[i] === b[j]
					? dp[i + 1][j + 1] + 1
					: Math.max(dp[i + 1][j], dp[i][j + 1]);
		}
	}

	const matched = new Array(n).fill(false);
	let i = 0;
	let j = 0;
	while (i < n && j < m) {
		if (a[i] && a[i] === b[j]) {
			matched[i] = true;
			i++;
			j++;
		} else if (dp[i + 1][j] >= dp[i][j + 1]) {
			i++;
		} else {
			j++;
		}
	}
	return matched;
}

async function transcribeAudio(
	bytes: Uint8Array,
	mimeType: string,
	ext: string,
): Promise<string> {
	const form = new FormData();
	form.append("file", new Blob([bytes], { type: mimeType }), `audio.${ext}`);
	form.append("model", GROQ_MODEL);
	form.append("response_format", "json");

	const res = await fetch(
		"https://api.groq.com/openai/v1/audio/transcriptions",
		{
			method: "POST",
			headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
			body: form,
		},
	);

	if (!res.ok) {
		const errText = await res.text();
		console.error("Groq transcription error", res.status, errText);
		throw new Error("Speech-to-text failed upstream");
	}

	const json = await res.json();
	const text = json?.text;
	if (typeof text !== "string") {
		throw new Error("Speech-to-text returned an unexpected response");
	}
	return text;
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
			.from("pronunciation_attempts")
			.select("id", { count: "exact", head: true })
			.gte("created_at", since);

		if (countError) {
			console.error("count error", countError);
			return json({ error: "Failed to check usage" }, 500);
		}
		if ((count ?? 0) >= DAILY_LIMIT) {
			return json(
				{ error: "Daily practice limit reached. Please try again tomorrow." },
				429,
			);
		}

		if (!GROQ_API_KEY) {
			return json({ error: "Server misconfigured: missing Groq key" }, 500);
		}

		const body = await req.json().catch(() => null);
		const conversionId = body?.conversionId as string | undefined;
		const lineIndex = body?.lineIndex as number | undefined;
		const expectedText = body?.expectedText as string | undefined;
		const audioBase64 = body?.audioBase64 as string | undefined;
		const mimeType = (body?.mimeType as string | undefined) ?? "audio/webm";

		if (
			!expectedText?.trim() ||
			!audioBase64 ||
			typeof lineIndex !== "number"
		) {
			return json(
				{ error: "expectedText, lineIndex and audioBase64 are required" },
				400,
			);
		}

		const expectedWords = tokenize(expectedText);
		if (expectedWords.length === 0) {
			return json({ error: "expectedText has no words" }, 400);
		}

		const bytes = Uint8Array.from(atob(audioBase64), (c) => c.charCodeAt(0));
		const ext = EXT_BY_MIME[mimeType] ?? "webm";

		let transcript: string;
		try {
			transcript = await transcribeAudio(bytes, mimeType, ext);
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Speech-to-text failed";
			return json({ error: message }, 502);
		}

		const spokenWords = tokenize(transcript);
		const matched = alignWords(expectedWords, spokenWords);
		const wordResults: WordResult[] = expectedWords.map((word, idx) => ({
			word,
			correct: matched[idx],
		}));
		const accuracyScore = Math.round(
			(matched.filter(Boolean).length / expectedWords.length) * 100,
		);

		const audioPath = `${user.id}/${crypto.randomUUID()}.${ext}`;
		const { error: uploadError } = await supabase.storage
			.from("pronunciation-audio")
			.upload(audioPath, bytes, { contentType: mimeType });

		if (uploadError) {
			console.error("upload error", uploadError);
			return json({ error: "Failed to save recording" }, 500);
		}

		const { data: inserted, error: insertError } = await supabase
			.from("pronunciation_attempts")
			.insert({
				user_id: user.id,
				conversion_id: conversionId ?? null,
				line_index: lineIndex,
				expected_text: expectedText,
				transcript,
				word_results: wordResults,
				accuracy_score: accuracyScore,
				audio_path: audioPath,
			})
			.select()
			.single();

		if (insertError) {
			console.error("insert error", insertError);
			return json({ error: "Failed to save attempt" }, 500);
		}

		return json({ attempt: inserted });
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
