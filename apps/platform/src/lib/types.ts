export interface IpaLine {
	text: string;
	ipa: string;
}

export interface Conversion {
	id: string;
	user_id: string;
	language: string;
	original_text: string;
	ipa_lines: IpaLine[];
	is_favorite: boolean;
	created_at: string;
}

export type WordStatus = "correct" | "mispronounced" | "omitted";

export interface WordResult {
	word: string;
	status: WordStatus;
}

export type PronunciationScope = "line" | "overall";

export interface PronunciationAttempt {
	id: string;
	user_id: string;
	conversion_id: string | null;
	scope: PronunciationScope;
	line_index: number | null;
	expected_text: string;
	transcript: string;
	word_results: WordResult[];
	extra_words: string[];
	accuracy_score: number;
	completeness_score: number;
	overall_score: number;
	fluency_score: number | null;
	duration_seconds: number | null;
	audio_path: string;
	created_at: string;
}
