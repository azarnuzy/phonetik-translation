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
