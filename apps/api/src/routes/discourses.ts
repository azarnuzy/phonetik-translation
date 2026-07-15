import { Hono } from "hono";
import { optionalAuth } from "../middleware/auth";
import type { AppEnv } from "../types";
import { prisma } from "../utils/prisma";

export const discourses = new Hono<AppEnv>();

discourses.use("*", optionalAuth);

async function learnedCountByDiscourse(userId: string | null) {
	if (!userId) return new Map<string, number>();
	const rows = await prisma.userWordProgress.groupBy({
		by: ["vocabularyWordId"],
		where: { supabaseUserId: userId, learned: true },
	});
	const wordIds = rows.map((r) => r.vocabularyWordId);
	if (wordIds.length === 0) return new Map<string, number>();

	const words = await prisma.vocabularyWord.findMany({
		where: { id: { in: wordIds } },
		select: { discourseId: true },
	});
	const counts = new Map<string, number>();
	for (const w of words) {
		counts.set(w.discourseId, (counts.get(w.discourseId) ?? 0) + 1);
	}
	return counts;
}

discourses.get("/", async (c) => {
	const userId = c.get("userId");
	const list = await prisma.discourse.findMany({
		orderBy: { order: "asc" },
		include: { _count: { select: { vocabularyWords: true } } },
	});
	const learned = await learnedCountByDiscourse(userId);

	return c.json(
		list.map((d) => ({
			slug: d.slug,
			title: d.title,
			description: d.description,
			order: d.order,
			comingSoon: d.comingSoon,
			totalWords: d._count.vocabularyWords,
			learnedWords: learned.get(d.id) ?? 0,
		})),
	);
});

discourses.get("/:slug", async (c) => {
	const slug = c.req.param("slug");
	const d = await prisma.discourse.findUnique({
		where: { slug },
		include: {
			_count: {
				select: {
					vocabularyWords: true,
					phrasalVerbs: true,
					wordFormationEntries: true,
					wordPatterns: true,
					prepositionalPhrases: true,
					quizQuestions: true,
				},
			},
		},
	});
	if (!d) return c.json({ error: "Discourse not found" }, 404);

	const userId = c.get("userId");
	const learned = await learnedCountByDiscourse(userId);

	return c.json({
		slug: d.slug,
		title: d.title,
		description: d.description,
		comingSoon: d.comingSoon,
		sections: {
			topicVocabulary: {
				total: d._count.vocabularyWords,
				learned: learned.get(d.id) ?? 0,
			},
			phrasalVerbs: { total: d._count.phrasalVerbs },
			wordFormation: { total: d._count.wordFormationEntries },
			wordPatterns: { total: d._count.wordPatterns },
			prepositionalPhrases: { total: d._count.prepositionalPhrases },
			quiz: { total: d._count.quizQuestions },
		},
	});
});

async function requireDiscourse(slug: string) {
	return prisma.discourse.findUnique({ where: { slug } });
}

discourses.get("/:slug/vocabulary", async (c) => {
	const discourse = await requireDiscourse(c.req.param("slug"));
	if (!discourse) return c.json({ error: "Discourse not found" }, 404);

	const words = await prisma.vocabularyWord.findMany({
		where: { discourseId: discourse.id },
		orderBy: { order: "asc" },
	});

	const userId = c.get("userId");
	const progress = userId
		? await prisma.userWordProgress.findMany({
				where: {
					supabaseUserId: userId,
					vocabularyWordId: { in: words.map((w) => w.id) },
				},
			})
		: [];
	const progressByWord = new Map(progress.map((p) => [p.vocabularyWordId, p]));

	return c.json(
		words.map((w) => ({
			id: w.id,
			word: w.word,
			wordClass: w.wordClass,
			meaning: w.meaning,
			example: w.example,
			learned: progressByWord.get(w.id)?.learned ?? false,
			saved: progressByWord.get(w.id)?.saved ?? false,
		})),
	);
});

discourses.get("/:slug/phrasal-verbs", async (c) => {
	const discourse = await requireDiscourse(c.req.param("slug"));
	if (!discourse) return c.json({ error: "Discourse not found" }, 404);

	const items = await prisma.phrasalVerb.findMany({
		where: { discourseId: discourse.id },
		orderBy: { order: "asc" },
	});
	return c.json(
		items.map((i) => ({ id: i.id, phrase: i.phrase, meaning: i.meaning })),
	);
});

discourses.get("/:slug/word-formation", async (c) => {
	const discourse = await requireDiscourse(c.req.param("slug"));
	if (!discourse) return c.json({ error: "Discourse not found" }, 404);

	const entries = await prisma.wordFormationEntry.findMany({
		where: { discourseId: discourse.id },
		orderBy: { order: "asc" },
		include: { forms: true },
	});
	return c.json(
		entries.map((e) => ({
			id: e.id,
			baseWord: e.baseWord,
			forms: e.forms.map((f) => ({
				form: f.form,
				partOfSpeech: f.partOfSpeech,
			})),
		})),
	);
});

discourses.get("/:slug/word-patterns", async (c) => {
	const discourse = await requireDiscourse(c.req.param("slug"));
	if (!discourse) return c.json({ error: "Discourse not found" }, 404);

	const items = await prisma.wordPattern.findMany({
		where: { discourseId: discourse.id },
		orderBy: { order: "asc" },
	});
	return c.json(
		items.map((i) => ({
			id: i.id,
			category: i.category,
			pattern: i.pattern,
			meaning: i.meaning,
		})),
	);
});

discourses.get("/:slug/prepositional-phrases", async (c) => {
	const discourse = await requireDiscourse(c.req.param("slug"));
	if (!discourse) return c.json({ error: "Discourse not found" }, 404);

	const items = await prisma.prepositionalPhrase.findMany({
		where: { discourseId: discourse.id },
		orderBy: { order: "asc" },
	});
	return c.json(
		items.map((i) => ({ id: i.id, phrase: i.phrase, meaning: i.meaning })),
	);
});

discourses.get("/:slug/quiz", async (c) => {
	const discourse = await requireDiscourse(c.req.param("slug"));
	if (!discourse) return c.json({ error: "Discourse not found" }, 404);

	const questions = await prisma.quizQuestion.findMany({
		where: { discourseId: discourse.id },
		orderBy: { order: "asc" },
		include: { options: true },
	});

	return c.json(
		questions.map((q) => ({
			id: q.id,
			category: q.category,
			prompt: q.prompt,
			// isCorrect is withheld -- verified server-side on submit
			options: q.options.map((o) => ({ id: o.id, text: o.text })),
		})),
	);
});
