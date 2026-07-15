import { Hono } from "hono";
import { requireAuth } from "../middleware/auth";
import type { AppEnv } from "../types";
import { prisma } from "../utils/prisma";

export const me = new Hono<AppEnv>();

me.use("*", requireAuth);

me.get("/stats", async (c) => {
	const userId = c.get("userId") as string;

	const stats = await prisma.userStats.findUnique({
		where: { supabaseUserId: userId },
	});
	const totalWords = await prisma.vocabularyWord.count();
	const learnedWords = await prisma.userWordProgress.count({
		where: { supabaseUserId: userId, learned: true },
	});
	const savedWords = await prisma.userWordProgress.count({
		where: { supabaseUserId: userId, saved: true },
	});

	return c.json({
		points: stats?.points ?? 0,
		currentStreak: stats?.currentStreak ?? 0,
		totalWords,
		learnedWords,
		savedWords,
	});
});
