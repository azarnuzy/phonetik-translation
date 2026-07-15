import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Headers":
		"authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SUPABASE_SERVICE_ROLE_KEY =
	Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const POINTS_PER_CORRECT_ANSWER = 10;

function json(body: unknown, status = 200) {
	return new Response(JSON.stringify(body), {
		status,
		headers: { ...corsHeaders, "Content-Type": "application/json" },
	});
}

function isSameDate(a: string, b: Date) {
	return a === b.toISOString().slice(0, 10);
}

function isYesterday(a: string, b: Date) {
	const prev = new Date(b);
	prev.setUTCDate(prev.getUTCDate() - 1);
	return isSameDate(a, prev);
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

		const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
			global: { headers: { Authorization: authHeader } },
		});
		const {
			data: { user },
			error: userError,
		} = await userClient.auth.getUser();

		if (userError || !user) {
			return json({ error: "Unauthorized" }, 401);
		}

		const body = await req.json().catch(() => null);
		const slug = body?.slug as string | undefined;
		const answers = body?.answers as
			| { questionId: string; optionId: string }[]
			| undefined;

		if (!slug || !Array.isArray(answers)) {
			return json({ error: "slug and answers are required" }, 400);
		}

		// Service role client: quiz_options.is_correct has no RLS select policy
		// for anon/authenticated, so scoring has to happen here, server-side.
		const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

		const { data: discourse, error: discourseError } = await admin
			.from("discourses")
			.select("id")
			.eq("slug", slug)
			.single();

		if (discourseError || !discourse) {
			return json({ error: "Discourse not found" }, 404);
		}

		const questionIds = answers.map((a) => a.questionId);
		const { data: questions, error: questionsError } = await admin
			.from("quiz_questions")
			.select("id, quiz_options(id, is_correct)")
			.eq("discourse_id", discourse.id)
			.in("id", questionIds);

		if (questionsError) {
			console.error("questions error", questionsError);
			return json({ error: "Failed to load quiz questions" }, 500);
		}

		const questionsById = new Map((questions ?? []).map((q) => [q.id, q]));

		let score = 0;
		const results = answers.map((a) => {
			const question = questionsById.get(a.questionId);
			const correctOption = question?.quiz_options?.find(
				(o: { id: string; is_correct: boolean }) => o.is_correct,
			);
			const isCorrect = correctOption?.id === a.optionId;
			if (isCorrect) score += 1;
			return {
				questionId: a.questionId,
				isCorrect,
				correctOptionId: correctOption?.id,
			};
		});

		const total = answers.length;

		const { error: attemptError } = await admin
			.from("user_quiz_attempts")
			.insert({
				user_id: user.id,
				discourse_id: discourse.id,
				score,
				total,
			});
		if (attemptError) {
			console.error("attempt insert error", attemptError);
			return json({ error: "Failed to record attempt" }, 500);
		}

		const { data: stats } = await admin
			.from("user_stats")
			.select("points, current_streak, last_active_date")
			.eq("user_id", user.id)
			.maybeSingle();

		const now = new Date();
		const today = now.toISOString().slice(0, 10);
		const nextStreak = !stats?.last_active_date
			? 1
			: isSameDate(stats.last_active_date, now)
				? stats.current_streak
				: isYesterday(stats.last_active_date, now)
					? stats.current_streak + 1
					: 1;
		const nextPoints = (stats?.points ?? 0) + score * POINTS_PER_CORRECT_ANSWER;

		const { error: statsError } = await admin.from("user_stats").upsert({
			user_id: user.id,
			points: nextPoints,
			current_streak: nextStreak,
			last_active_date: today,
		});
		if (statsError) {
			console.error("stats upsert error", statsError);
			return json({ error: "Failed to update stats" }, 500);
		}

		return json({
			score,
			total,
			accuracy: total === 0 ? 0 : Math.round((score / total) * 100),
			results,
		});
	} catch (err) {
		console.error(err);
		return json({ error: "Unexpected server error" }, 500);
	}
});
