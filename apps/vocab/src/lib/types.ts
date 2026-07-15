export interface DiscourseSummary {
	slug: string;
	title: string;
	description: string;
	order: number;
	comingSoon: boolean;
	totalWords: number;
	learnedWords: number;
}

export interface DiscourseDetail {
	slug: string;
	title: string;
	description: string;
	comingSoon: boolean;
	sections: {
		topicVocabulary: { total: number; learned: number };
		phrasalVerbs: { total: number };
		wordFormation: { total: number };
		wordPatterns: { total: number };
		prepositionalPhrases: { total: number };
		quiz: { total: number };
	};
}

export interface VocabularyWord {
	id: string;
	word: string;
	wordClass: string | null;
	meaning: string;
	example: string | null;
	learned: boolean;
	saved: boolean;
}

export interface PhrasalVerb {
	id: string;
	phrase: string;
	meaning: string;
}

export interface WordFormationEntry {
	id: string;
	baseWord: string;
	forms: { form: string; partOfSpeech: string }[];
}

export type WordPatternCategory = "ADJECTIVE" | "VERB" | "NOUN";

export interface WordPattern {
	id: string;
	category: WordPatternCategory;
	pattern: string;
	meaning: string | null;
}

export interface PrepositionalPhrase {
	id: string;
	phrase: string;
	meaning: string;
}

export interface QuizOption {
	id: string;
	text: string;
}

export interface QuizQuestion {
	id: string;
	category: string;
	prompt: string;
	options: QuizOption[];
}

export interface QuizSubmitResult {
	score: number;
	total: number;
	accuracy: number;
	results: {
		questionId: string;
		isCorrect: boolean;
		correctOptionId?: string;
	}[];
}

export interface MyWord {
	id: string;
	word: string;
	wordClass: string | null;
	meaning: string;
	example: string | null;
	discourse: { slug: string; title: string };
}

export interface MeStats {
	points: number;
	currentStreak: number;
	totalWords: number;
	learnedWords: number;
	savedWords: number;
}
