export function scoreTone(score: number): string {
	if (score >= 90) return "text-emerald-600";
	if (score >= 70) return "text-amber-600";
	return "text-red-600";
}

export function overallFeedback(scores: {
	accuracyScore: number;
	completenessScore: number;
	overallScore: number;
}): string {
	if (scores.overallScore >= 90) {
		return "Pengucapanmu sudah sangat baik, hampir sempurna!";
	}
	if (scores.completenessScore < 70) {
		return "Ada beberapa kata yang belum terucap. Coba baca ulang sampai seluruh kalimat selesai.";
	}
	if (scores.accuracyScore < 70) {
		return "Beberapa kata terdengar kurang tepat pengucapannya. Perhatikan kata yang bergaris bawah merah, lalu dengarkan pengucapan yang benar.";
	}
	return "Pengucapanmu sudah cukup baik. Terus berlatih agar semakin lancar.";
}

/** Speaking pace label (words/minute) - a simple, commonly used fluency proxy. */
export function wpmLabel(
	totalWords: number,
	durationSeconds: number | null,
): string | null {
	if (!durationSeconds || durationSeconds <= 0 || totalWords <= 0) return null;
	const wpm = Math.round((totalWords / durationSeconds) * 60);
	if (wpm < 80) return `${wpm} kata/menit (terlalu lambat)`;
	if (wpm <= 180) return `${wpm} kata/menit (wajar)`;
	return `${wpm} kata/menit (terlalu cepat)`;
}
