import { blobToBase64 } from "./audio";
import { compressImageToBase64 } from "./image";
import { ensureAnonymousSession, supabase } from "./supabase";
import type { Conversion, PronunciationAttempt } from "./types";

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

export async function processImage(
	file: File,
	language = "en-US",
): Promise<Conversion> {
	await ensureAnonymousSession();
	const { base64, mimeType } = await compressImageToBase64(file);

	const { data, error } = await supabase.functions.invoke<{
		conversion?: Conversion;
		error?: string;
	}>("process-image", {
		body: { imageBase64: base64, mimeType, language },
	});

	if (error) {
		throw new Error(await extractFunctionErrorMessage(error));
	}
	if (!data?.conversion) {
		throw new Error(data?.error ?? "Failed to process image");
	}

	return data.conversion;
}

export async function listConversions(
	onlyFavorites = false,
): Promise<Conversion[]> {
	await ensureAnonymousSession();

	let query = supabase
		.from("conversions")
		.select("*")
		.order("created_at", { ascending: false });
	if (onlyFavorites) {
		query = query.eq("is_favorite", true);
	}

	const { data, error } = await query;
	if (error) throw error;
	return (data ?? []) as Conversion[];
}

export async function setFavorite(
	id: string,
	isFavorite: boolean,
): Promise<void> {
	const { error } = await supabase
		.from("conversions")
		.update({ is_favorite: isFavorite })
		.eq("id", id);
	if (error) throw error;
}

export async function deleteConversion(id: string): Promise<void> {
	const { error } = await supabase.from("conversions").delete().eq("id", id);
	if (error) throw error;
}

export async function assessPronunciation(params: {
	conversionId?: string;
	lineIndex: number;
	expectedText: string;
	audioBlob: Blob;
	mimeType: string;
}): Promise<PronunciationAttempt> {
	await ensureAnonymousSession();
	const audioBase64 = await blobToBase64(params.audioBlob);

	const { data, error } = await supabase.functions.invoke<{
		attempt?: PronunciationAttempt;
		error?: string;
	}>("assess-pronunciation", {
		body: {
			conversionId: params.conversionId,
			lineIndex: params.lineIndex,
			expectedText: params.expectedText,
			audioBase64,
			mimeType: params.mimeType,
		},
	});

	if (error) {
		throw new Error(await extractFunctionErrorMessage(error));
	}
	if (!data?.attempt) {
		throw new Error(data?.error ?? "Gagal menilai pengucapan.");
	}

	return data.attempt;
}
