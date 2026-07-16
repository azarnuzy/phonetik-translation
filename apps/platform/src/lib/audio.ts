/** Converts a recorded audio Blob to a base64 string (no data-url prefix). */
export async function blobToBase64(blob: Blob): Promise<string> {
	const buffer = await blob.arrayBuffer();
	let binary = "";
	const bytes = new Uint8Array(buffer);
	for (let i = 0; i < bytes.length; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return btoa(binary);
}

const PREFERRED_MIME_TYPES = [
	"audio/webm",
	"audio/mp4",
	"audio/ogg",
	"audio/wav",
];

/** Picks the first audio mime type MediaRecorder supports in this browser. */
export function pickSupportedMimeType(): string {
	if (typeof MediaRecorder === "undefined") return PREFERRED_MIME_TYPES[0];
	return (
		PREFERRED_MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type)) ??
		PREFERRED_MIME_TYPES[0]
	);
}
