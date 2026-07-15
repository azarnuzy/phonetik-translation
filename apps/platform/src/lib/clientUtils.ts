export function speak(text: string, lang = "en-US") {
	if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
	window.speechSynthesis.cancel();
	const utterance = new SpeechSynthesisUtterance(text);
	utterance.lang = lang;
	window.speechSynthesis.speak(utterance);
}

export function speakAll(texts: string[], lang = "en-US") {
	if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
	window.speechSynthesis.cancel();
	for (const text of texts) {
		const utterance = new SpeechSynthesisUtterance(text);
		utterance.lang = lang;
		window.speechSynthesis.speak(utterance);
	}
}

export async function copyToClipboard(text: string): Promise<boolean> {
	try {
		await navigator.clipboard.writeText(text);
		return true;
	} catch {
		return false;
	}
}

export function downloadTextFile(filename: string, content: string) {
	const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}
