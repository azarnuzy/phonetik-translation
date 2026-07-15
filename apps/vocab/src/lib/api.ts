import { ensureAnonymousSession, getCurrentUserId, supabase } from "./supabase";
import type {
	DiscourseDetail,
	DiscourseSummary,
	MeStats,
	MyWord,
	PhrasalVerb,
	PrepositionalPhrase,
	QuizQuestion,
	QuizSubmitResult,
	VocabularyWord,
	WordFormationEntry,
	WordPattern,
} from "./types";

async function extractFunctionErrorMessage(error: {
	message: string;
	context?: unknown;
}): Promise<string> {
	const context = error.context as Response | undefined;
	if (context && typeof context.json === "function") {
		try {
			const body = await context.json();
			if (typeof body?.error === "string") return body.error;
		} catch {
			// fall through to generic message below
		}
	}
	return error.message;
}

async function requireDiscourseId(slug: string): Promise<string> {
	const { data, error } = await supabase
		.from("discourses")
		.select("id")
		.eq("slug", slug)
		.single();
	if (error || !data) throw new Error("Discourse not found");
	return data.id;
}

export async function listDiscourses(): Promise<DiscourseSummary[]> {
	await ensureAnonymousSession();

	const { data: discourses, error } = await supabase
		.from("discourses")
		.select("id, slug, title, description, order, coming_soon")
		.order("order");
	if (error) throw error;

	const { data: words, error: wordsError } = await supabase
		.from("vocabulary_words")
		.select("id, discourse_id");
	if (wordsError) throw wordsError;

	const totalByDiscourse = new Map<string, number>();
	const discourseByWord = new Map<string, string>();
	for (const w of words ?? []) {
		totalByDiscourse.set(
			w.discourse_id,
			(totalByDiscourse.get(w.discourse_id) ?? 0) + 1,
		);
		discourseByWord.set(w.id, w.discourse_id);
	}

	const userId = await getCurrentUserId();
	const learnedByDiscourse = new Map<string, number>();
	if (userId) {
		const { data: progress, error: progressError } = await supabase
			.from("user_word_progress")
			.select("vocabulary_word_id")
			.eq("user_id", userId)
			.eq("learned", true);
		if (progressError) throw progressError;
		for (const p of progress ?? []) {
			const discourseId = discourseByWord.get(p.vocabulary_word_id);
			if (!discourseId) continue;
			learnedByDiscourse.set(
				discourseId,
				(learnedByDiscourse.get(discourseId) ?? 0) + 1,
			);
		}
	}

	return (discourses ?? []).map((d) => ({
		slug: d.slug,
		title: d.title,
		description: d.description,
		order: d.order,
		comingSoon: d.coming_soon,
		totalWords: totalByDiscourse.get(d.id) ?? 0,
		learnedWords: learnedByDiscourse.get(d.id) ?? 0,
	}));
}

export async function getDiscourse(slug: string): Promise<DiscourseDetail> {
	await ensureAnonymousSession();

	const { data: d, error } = await supabase
		.from("discourses")
		.select("id, slug, title, description, coming_soon")
		.eq("slug", slug)
		.single();
	if (error || !d) throw new Error("Discourse not found");

	const countFor = async (table: string) => {
		const { count } = await supabase
			.from(table)
			.select("id", { count: "exact", head: true })
			.eq("discourse_id", d.id);
		return count ?? 0;
	};

	const [
		vocabularyTotal,
		phrasalVerbsTotal,
		wordFormationTotal,
		wordPatternsTotal,
		prepositionalPhrasesTotal,
		quizTotal,
	] = await Promise.all([
		countFor("vocabulary_words"),
		countFor("phrasal_verbs"),
		countFor("word_formation_entries"),
		countFor("word_patterns"),
		countFor("prepositional_phrases"),
		countFor("quiz_questions"),
	]);

	const userId = await getCurrentUserId();
	let learned = 0;
	if (userId) {
		// Fetch this user's learned words with their discourse embedded, then
		// filter client-side -- avoids relying on PostgREST's filter-through-embed
		// syntax for a dataset this small.
		const { data: progress, error: progressError } = await supabase
			.from("user_word_progress")
			.select("learned, vocabulary_words(discourse_id)")
			.eq("user_id", userId)
			.eq("learned", true);
		if (progressError) throw progressError;
		learned = (progress ?? []).filter(
			(p) =>
				(p.vocabulary_words as unknown as { discourse_id: string } | null)
					?.discourse_id === d.id,
		).length;
	}

	return {
		slug: d.slug,
		title: d.title,
		description: d.description,
		comingSoon: d.coming_soon,
		sections: {
			topicVocabulary: { total: vocabularyTotal, learned },
			phrasalVerbs: { total: phrasalVerbsTotal },
			wordFormation: { total: wordFormationTotal },
			wordPatterns: { total: wordPatternsTotal },
			prepositionalPhrases: { total: prepositionalPhrasesTotal },
			quiz: { total: quizTotal },
		},
	};
}

export async function listVocabulary(slug: string): Promise<VocabularyWord[]> {
	await ensureAnonymousSession();
	const discourseId = await requireDiscourseId(slug);

	const { data: words, error } = await supabase
		.from("vocabulary_words")
		.select("id, word, word_class, meaning, example")
		.eq("discourse_id", discourseId)
		.order("order");
	if (error) throw error;

	const userId = await getCurrentUserId();
	const progressByWord = new Map<
		string,
		{ learned: boolean; saved: boolean }
	>();
	if (userId && words && words.length > 0) {
		const { data: progress, error: progressError } = await supabase
			.from("user_word_progress")
			.select("vocabulary_word_id, learned, saved")
			.eq("user_id", userId)
			.in(
				"vocabulary_word_id",
				words.map((w) => w.id),
			);
		if (progressError) throw progressError;
		for (const p of progress ?? []) {
			progressByWord.set(p.vocabulary_word_id, p);
		}
	}

	return (words ?? []).map((w) => ({
		id: w.id,
		word: w.word,
		wordClass: w.word_class,
		meaning: w.meaning,
		example: w.example,
		learned: progressByWord.get(w.id)?.learned ?? false,
		saved: progressByWord.get(w.id)?.saved ?? false,
	}));
}

export async function listPhrasalVerbs(slug: string): Promise<PhrasalVerb[]> {
	await ensureAnonymousSession();
	const discourseId = await requireDiscourseId(slug);

	const { data, error } = await supabase
		.from("phrasal_verbs")
		.select("id, phrase, meaning")
		.eq("discourse_id", discourseId)
		.order("order");
	if (error) throw error;
	return data ?? [];
}

export async function listWordFormation(
	slug: string,
): Promise<WordFormationEntry[]> {
	await ensureAnonymousSession();
	const discourseId = await requireDiscourseId(slug);

	const { data, error } = await supabase
		.from("word_formation_entries")
		.select("id, base_word, word_formation_forms(form, part_of_speech)")
		.eq("discourse_id", discourseId)
		.order("order");
	if (error) throw error;

	return (data ?? []).map((e) => ({
		id: e.id,
		baseWord: e.base_word,
		forms: e.word_formation_forms.map((f) => ({
			form: f.form,
			partOfSpeech: f.part_of_speech,
		})),
	}));
}

export async function listWordPatterns(slug: string): Promise<WordPattern[]> {
	await ensureAnonymousSession();
	const discourseId = await requireDiscourseId(slug);

	const { data, error } = await supabase
		.from("word_patterns")
		.select("id, category, pattern, meaning")
		.eq("discourse_id", discourseId)
		.order("order");
	if (error) throw error;
	return data ?? [];
}

export async function listPrepositionalPhrases(
	slug: string,
): Promise<PrepositionalPhrase[]> {
	await ensureAnonymousSession();
	const discourseId = await requireDiscourseId(slug);

	const { data, error } = await supabase
		.from("prepositional_phrases")
		.select("id, phrase, meaning")
		.eq("discourse_id", discourseId)
		.order("order");
	if (error) throw error;
	return data ?? [];
}

export async function getQuiz(slug: string): Promise<QuizQuestion[]> {
	await ensureAnonymousSession();
	const discourseId = await requireDiscourseId(slug);

	const { data: questions, error } = await supabase
		.from("quiz_questions")
		.select("id, category, prompt")
		.eq("discourse_id", discourseId)
		.order("order");
	if (error) throw error;
	if (!questions || questions.length === 0) return [];

	// quiz_options_public omits is_correct -- scoring only ever happens
	// server-side, in the submit-quiz edge function.
	const { data: options, error: optionsError } = await supabase
		.from("quiz_options_public")
		.select("id, question_id, text")
		.in(
			"question_id",
			questions.map((q) => q.id),
		);
	if (optionsError) throw optionsError;

	const optionsByQuestion = new Map<string, { id: string; text: string }[]>();
	for (const o of options ?? []) {
		const list = optionsByQuestion.get(o.question_id) ?? [];
		list.push({ id: o.id, text: o.text });
		optionsByQuestion.set(o.question_id, list);
	}

	return questions.map((q) => ({
		id: q.id,
		category: q.category,
		prompt: q.prompt,
		options: optionsByQuestion.get(q.id) ?? [],
	}));
}

export async function submitQuiz(
	slug: string,
	answers: { questionId: string; optionId: string }[],
): Promise<QuizSubmitResult> {
	await ensureAnonymousSession();

	const { data, error } = await supabase.functions.invoke<QuizSubmitResult>(
		"submit-quiz",
		{ body: { slug, answers } },
	);
	if (error) {
		throw new Error(await extractFunctionErrorMessage(error));
	}
	if (!data) throw new Error("Empty response from submit-quiz");
	return data;
}

async function setWordProgress(
	id: string,
	patch: { learned?: boolean; saved?: boolean },
) {
	await ensureAnonymousSession();
	const userId = await getCurrentUserId();
	if (!userId) throw new Error("Not signed in");

	const { error } = await supabase
		.from("user_word_progress")
		.upsert(
			{ user_id: userId, vocabulary_word_id: id, ...patch },
			{ onConflict: "user_id,vocabulary_word_id" },
		);
	if (error) throw error;
}

export async function setWordLearned(
	id: string,
	learned: boolean,
): Promise<{ learned: boolean }> {
	await setWordProgress(id, { learned });
	return { learned };
}

export async function setWordSaved(
	id: string,
	saved: boolean,
): Promise<{ saved: boolean }> {
	await setWordProgress(id, { saved });
	return { saved };
}

export async function listMyWords(): Promise<MyWord[]> {
	await ensureAnonymousSession();
	const userId = await getCurrentUserId();
	if (!userId) return [];

	const { data, error } = await supabase
		.from("user_word_progress")
		.select(
			"updated_at, vocabulary_words(id, word, word_class, meaning, example, discourses(slug, title))",
		)
		.eq("user_id", userId)
		.eq("saved", true)
		.order("updated_at", { ascending: false });
	if (error) throw error;

	return (data ?? [])
		.filter((row) => row.vocabulary_words)
		.map((row) => {
			const w = row.vocabulary_words as unknown as {
				id: string;
				word: string;
				word_class: string | null;
				meaning: string;
				example: string | null;
				discourses: { slug: string; title: string };
			};
			return {
				id: w.id,
				word: w.word,
				wordClass: w.word_class,
				meaning: w.meaning,
				example: w.example,
				discourse: { slug: w.discourses.slug, title: w.discourses.title },
			};
		});
}

export async function getMyStats(): Promise<MeStats> {
	await ensureAnonymousSession();
	const userId = await getCurrentUserId();
	if (!userId) {
		return {
			points: 0,
			currentStreak: 0,
			totalWords: 0,
			learnedWords: 0,
			savedWords: 0,
		};
	}

	const [statsResult, totalWordsResult, learnedWordsResult, savedWordsResult] =
		await Promise.all([
			supabase
				.from("user_stats")
				.select("points, current_streak")
				.eq("user_id", userId)
				.maybeSingle(),
			supabase
				.from("vocabulary_words")
				.select("id", { count: "exact", head: true }),
			supabase
				.from("user_word_progress")
				.select("id", { count: "exact", head: true })
				.eq("user_id", userId)
				.eq("learned", true),
			supabase
				.from("user_word_progress")
				.select("id", { count: "exact", head: true })
				.eq("user_id", userId)
				.eq("saved", true),
		]);

	if (statsResult.error) throw statsResult.error;

	return {
		points: statsResult.data?.points ?? 0,
		currentStreak: statsResult.data?.current_streak ?? 0,
		totalWords: totalWordsResult.count ?? 0,
		learnedWords: learnedWordsResult.count ?? 0,
		savedWords: savedWordsResult.count ?? 0,
	};
}
