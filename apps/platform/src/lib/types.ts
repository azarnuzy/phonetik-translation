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

export interface WordResult {
	word: string;
	correct: boolean;
}

export interface PronunciationAttempt {
	id: string;
	user_id: string;
	conversion_id: string | null;
	line_index: number;
	expected_text: string;
	transcript: string;
	word_results: WordResult[];
	accuracy_score: number;
	audio_path: string;
	created_at: string;
}
