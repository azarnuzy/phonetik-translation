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

// Natural reading pace for the fluency heuristic (see computeScores below).
const IDEAL_WORDS_PER_MINUTE = 130;

const EXT_BY_MIME: Record<string, string> = {
	"audio/webm": "webm",
	"audio/ogg": "ogg",
	"audio/mp4": "m4a",
	"audio/mpeg": "mp3",
	"audio/wav": "wav",
};

type WordStatus = "correct" | "mispronounced" | "omitted";

interface WordResult {
	word: string;
	status: WordStatus;
}

function tokenize(text: string): string[] {
	return text.trim().split(/\s+/).filter(Boolean);
}

function normalizeWord(word: string): string {
	return word.toLowerCase().replace(/[^\p{L}\p{N}']/gu, "");
}

type Op =
	| { type: "match" | "sub" | "del"; expectedIdx: number }
	| { type: "ins"; spokenIdx: number };

// Standard word-level edit-distance alignment (the same technique used to
// compute Word Error Rate in speech recognition), classifying every expected
// word as correct / mispronounced (substitution) / omitted (deletion), and
// every unmatched spoken word as an "extra" (insertion) not tied to the
// reference text.
function alignWords(
	expectedOriginal: string[],
	spokenOriginal: string[],
): { wordResults: WordResult[]; extraWords: string[] } {
	const a = expectedOriginal.map(normalizeWord);
	const b = spokenOriginal.map(normalizeWord);
	const n = a.length;
	const m = b.length;

	const dp: number[][] = Array.from({ length: n + 1 }, () =>
		new Array(m + 1).fill(0),
	);
	for (let i = 0; i <= n; i++) dp[i][0] = i;
	for (let j = 0; j <= m; j++) dp[0][j] = j;
	for (let i = 1; i <= n; i++) {
		for (let j = 1; j <= m; j++) {
			dp[i][j] =
				a[i - 1] && a[i - 1] === b[j - 1]
					? dp[i - 1][j - 1]
					: 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
		}
	}

	const ops: Op[] = [];
	let i = n;
	let j = m;
	while (i > 0 || j > 0) {
		if (
			i > 0 &&
			j > 0 &&
			a[i - 1] === b[j - 1] &&
			dp[i][j] === dp[i - 1][j - 1]
		) {
			ops.push({ type: "match", expectedIdx: i - 1 });
			i--;
			j--;
		} else if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + 1) {
			ops.push({ type: "sub", expectedIdx: i - 1 });
			i--;
			j--;
		} else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
			ops.push({ type: "del", expectedIdx: i - 1 });
			i--;
		} else {
			ops.push({ type: "ins", spokenIdx: j - 1 });
			j--;
		}
	}
	ops.reverse();

	const wordResults: WordResult[] = [];
	const extraWords: string[] = [];
	for (const op of ops) {
		if (op.type === "match") {
			wordResults.push({
				word: expectedOriginal[op.expectedIdx],
				status: "correct",
			});
		} else if (op.type === "sub") {
			wordResults.push({
				word: expectedOriginal[op.expectedIdx],
				status: "mispronounced",
			});
		} else if (op.type === "del") {
			wordResults.push({
				word: expectedOriginal[op.expectedIdx],
				status: "omitted",
			});
		} else {
			extraWords.push(spokenOriginal[op.spokenIdx]);
		}
	}

	return { wordResults, extraWords };
}

// Mirrors the common pronunciation-assessment breakdown (Azure Pronunciation
// Assessment, Speechace, etc.): Accuracy (of the words you attempted, how many
// were right), Completeness (how much of the reference text you attempted at
// all), Fluency (speaking pace vs. a natural reading pace), and an Overall
// score combining accuracy + completeness.
function computeScores(
	wordResults: WordResult[],
	durationSeconds: number | null,
) {
	const total = wordResults.length;
	const correct = wordResults.filter((w) => w.status === "correct").length;
	const mispronounced = wordResults.filter(
		(w) => w.status === "mispronounced",
	).length;
	const attempted = correct + mispronounced;

	const accuracyScore =
		attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
	const completenessScore =
		total > 0 ? Math.round((attempted / total) * 100) : 0;
	const overallScore = total > 0 ? Math.round((correct / total) * 100) : 0;

	let fluencyScore: number | null = null;
	if (durationSeconds && durationSeconds > 0 && total > 0) {
		const wpm = (total / durationSeconds) * 60;
		const ratio = wpm / IDEAL_WORDS_PER_MINUTE;
		if (ratio >= 0.7 && ratio <= 1.4) {
			fluencyScore = 100;
		} else if (ratio < 0.7) {
			fluencyScore = Math.max(0, Math.round((ratio / 0.7) * 100));
		} else {
			fluencyScore = Math.max(0, Math.round(100 - (ratio - 1.4) * 80));
		}
	}

	return { accuracyScore, completenessScore, overallScore, fluencyScore };
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
		const scope = ((body?.scope as string | undefined) ?? "line") as
			| "line"
			| "overall";
		const lineIndex = body?.lineIndex as number | undefined;
		const expectedText = body?.expectedText as string | undefined;
		const audioBase64 = body?.audioBase64 as string | undefined;
		const mimeType = (body?.mimeType as string | undefined) ?? "audio/webm";
		const durationSeconds = body?.durationSeconds as number | undefined;

		if (scope !== "line" && scope !== "overall") {
			return json({ error: "scope must be 'line' or 'overall'" }, 400);
		}
		if (scope === "line" && typeof lineIndex !== "number") {
			return json({ error: "lineIndex is required for scope 'line'" }, 400);
		}
		if (!expectedText?.trim() || !audioBase64) {
			return json({ error: "expectedText and audioBase64 are required" }, 400);
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
		const { wordResults, extraWords } = alignWords(expectedWords, spokenWords);
		const { accuracyScore, completenessScore, overallScore, fluencyScore } =
			computeScores(wordResults, durationSeconds ?? null);

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
				scope,
				line_index: scope === "line" ? lineIndex : null,
				expected_text: expectedText,
				transcript,
				word_results: wordResults,
				extra_words: extraWords,
				accuracy_score: accuracyScore,
				completeness_score: completenessScore,
				overall_score: overallScore,
				fluency_score: fluencyScore,
				duration_seconds: durationSeconds ?? null,
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
