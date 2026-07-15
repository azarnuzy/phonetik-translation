import { getAccessToken } from "./supabase";
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

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function request<T>(
	path: string,
	options: { method?: string; body?: unknown; auth?: boolean } = {},
): Promise<T> {
	const headers: Record<string, string> = {};
	if (options.body !== undefined) headers["Content-Type"] = "application/json";

	if (options.auth) {
		const token = await getAccessToken();
		if (token) headers.Authorization = `Bearer ${token}`;
	}

	const res = await fetch(`${API_URL}${path}`, {
		method: options.method ?? "GET",
		headers,
		body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
	});

	if (!res.ok) {
		const body = await res.json().catch(() => ({}));
		throw new Error(body?.error ?? `Request failed: ${res.status}`);
	}

	return res.json() as Promise<T>;
}

export const listDiscourses = () =>
	request<DiscourseSummary[]>("/discourses", { auth: true });

export const getDiscourse = (slug: string) =>
	request<DiscourseDetail>(`/discourses/${slug}`, { auth: true });

export const listVocabulary = (slug: string) =>
	request<VocabularyWord[]>(`/discourses/${slug}/vocabulary`, { auth: true });

export const listPhrasalVerbs = (slug: string) =>
	request<PhrasalVerb[]>(`/discourses/${slug}/phrasal-verbs`);

export const listWordFormation = (slug: string) =>
	request<WordFormationEntry[]>(`/discourses/${slug}/word-formation`);

export const listWordPatterns = (slug: string) =>
	request<WordPattern[]>(`/discourses/${slug}/word-patterns`);

export const listPrepositionalPhrases = (slug: string) =>
	request<PrepositionalPhrase[]>(`/discourses/${slug}/prepositional-phrases`);

export const getQuiz = (slug: string) =>
	request<QuizQuestion[]>(`/discourses/${slug}/quiz`);

export const submitQuiz = (
	slug: string,
	answers: { questionId: string; optionId: string }[],
) =>
	request<QuizSubmitResult>(`/discourses/${slug}/quiz/submit`, {
		method: "POST",
		body: { answers },
		auth: true,
	});

export const setWordLearned = (id: string, learned: boolean) =>
	request<{ learned: boolean }>(`/words/${id}/learned`, {
		method: "POST",
		body: { learned },
		auth: true,
	});

export const setWordSaved = (id: string, saved: boolean) =>
	request<{ saved: boolean }>(`/words/${id}/save`, {
		method: "POST",
		body: { saved },
		auth: true,
	});

export const listMyWords = () =>
	request<MyWord[]>("/words/my-words", { auth: true });

export const getMyStats = () => request<MeStats>("/me/stats", { auth: true });
