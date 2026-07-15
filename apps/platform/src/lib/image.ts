interface CompressOptions {
	maxDimension?: number;
	quality?: number;
}

/** Resizes + JPEG-compresses an image client-side before it's sent anywhere. */
export async function compressImageToBase64(
	file: File,
	{ maxDimension = 1600, quality = 0.82 }: CompressOptions = {},
): Promise<{ base64: string; mimeType: string }> {
	const bitmap = await createImageBitmap(file);
	const scale = Math.min(
		1,
		maxDimension / Math.max(bitmap.width, bitmap.height),
	);
	const width = Math.round(bitmap.width * scale);
	const height = Math.round(bitmap.height * scale);

	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("Canvas is not supported in this browser");
	ctx.drawImage(bitmap, 0, 0, width, height);

	const mimeType = "image/jpeg";
	const dataUrl = canvas.toDataURL(mimeType, quality);
	const base64 = dataUrl.split(",")[1] ?? "";

	return { base64, mimeType };
}
