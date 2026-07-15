import { Hono } from "hono";
import { requireAuth } from "../middleware/auth";
import type { AppEnv } from "../types";
import { prisma } from "../utils/prisma";

export const words = new Hono<AppEnv>();

words.use("*", requireAuth);

words.get("/my-words", async (c) => {
	const userId = c.get("userId") as string;

	const saved = await prisma.userWordProgress.findMany({
		where: { supabaseUserId: userId, saved: true },
		include: { vocabularyWord: { include: { discourse: true } } },
		orderBy: { updatedAt: "desc" },
	});

	return c.json(
		saved.map((p) => ({
			id: p.vocabularyWord.id,
			word: p.vocabularyWord.word,
			wordClass: p.vocabularyWord.wordClass,
			meaning: p.vocabularyWord.meaning,
			example: p.vocabularyWord.example,
			discourse: {
				slug: p.vocabularyWord.discourse.slug,
				title: p.vocabularyWord.discourse.title,
			},
		})),
	);
});

async function setProgress(
	userId: string,
	wordId: string,
	patch: { learned?: boolean; saved?: boolean },
) {
	const word = await prisma.vocabularyWord.findUnique({
		where: { id: wordId },
	});
	if (!word) return null;

	return prisma.userWordProgress.upsert({
		where: {
			supabaseUserId_vocabularyWordId: {
				supabaseUserId: userId,
				vocabularyWordId: wordId,
			},
		},
		create: { supabaseUserId: userId, vocabularyWordId: wordId, ...patch },
		update: patch,
	});
}

words.post("/:id/learned", async (c) => {
	const userId = c.get("userId") as string;
	const body = await c.req.json<{ learned: boolean }>();
	const result = await setProgress(userId, c.req.param("id"), {
		learned: !!body.learned,
	});
	if (!result) return c.json({ error: "Word not found" }, 404);
	return c.json({ learned: result.learned });
});

words.post("/:id/save", async (c) => {
	const userId = c.get("userId") as string;
	const body = await c.req.json<{ saved: boolean }>();
	const result = await setProgress(userId, c.req.param("id"), {
		saved: !!body.saved,
	});
	if (!result) return c.json({ error: "Word not found" }, 404);
	return c.json({ saved: result.saved });
});
