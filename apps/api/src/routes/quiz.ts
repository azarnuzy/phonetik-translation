import { Hono } from "hono";
import { requireAuth } from "../middleware/auth";
import type { AppEnv } from "../types";
import { prisma } from "../utils/prisma";

export const quiz = new Hono<AppEnv>();

quiz.use("*", requireAuth);

const POINTS_PER_CORRECT_ANSWER = 10;

function isSameDate(a: Date, b: Date) {
	return a.toISOString().slice(0, 10) === b.toISOString().slice(0, 10);
}

function isYesterday(a: Date, b: Date) {
	const prev = new Date(b);
	prev.setUTCDate(prev.getUTCDate() - 1);
	return isSameDate(a, prev);
}

quiz.post("/discourses/:slug/quiz/submit", async (c) => {
	const userId = c.get("userId") as string;
	const discourse = await prisma.discourse.findUnique({
		where: { slug: c.req.param("slug") },
	});
	if (!discourse) return c.json({ error: "Discourse not found" }, 404);

	const body = await c.req.json<{
		answers: { questionId: string; optionId: string }[];
	}>();
	const questionIds = body.answers.map((a) => a.questionId);

	const questions = await prisma.quizQuestion.findMany({
		where: { id: { in: questionIds }, discourseId: discourse.id },
		include: { options: true },
	});
	const questionsById = new Map(questions.map((q) => [q.id, q]));

	let score = 0;
	const results = body.answers.map((a) => {
		const question = questionsById.get(a.questionId);
		const correctOption = question?.options.find((o) => o.isCorrect);
		const isCorrect = correctOption?.id === a.optionId;
		if (isCorrect) score += 1;
		return {
			questionId: a.questionId,
			isCorrect,
			correctOptionId: correctOption?.id,
		};
	});

	const total = body.answers.length;

	await prisma.userQuizAttempt.create({
		data: { supabaseUserId: userId, discourseId: discourse.id, score, total },
	});

	const now = new Date();
	const stats = await prisma.userStats.findUnique({
		where: { supabaseUserId: userId },
	});
	const nextStreak = !stats?.lastActiveDate
		? 1
		: isSameDate(stats.lastActiveDate, now)
			? stats.currentStreak
			: isYesterday(stats.lastActiveDate, now)
				? stats.currentStreak + 1
				: 1;

	await prisma.userStats.upsert({
		where: { supabaseUserId: userId },
		create: {
			supabaseUserId: userId,
			points: score * POINTS_PER_CORRECT_ANSWER,
			currentStreak: 1,
			lastActiveDate: now,
		},
		update: {
			points: { increment: score * POINTS_PER_CORRECT_ANSWER },
			currentStreak: nextStreak,
			lastActiveDate: now,
		},
	});

	return c.json({
		score,
		total,
		accuracy: total === 0 ? 0 : Math.round((score / total) * 100),
		results,
	});
});
