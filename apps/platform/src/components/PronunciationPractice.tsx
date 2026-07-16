import { Loader2, Volume2 } from "lucide-react";
import { useState } from "react";
import { AudioRecorder } from "@/components/AudioRecorder";
import { assessPronunciation } from "@/lib/api";
import { speak } from "@/lib/clientUtils";
import type { PronunciationAttempt } from "@/lib/types";

interface PronunciationPracticeProps {
	conversionId: string;
	lineIndex: number;
	text: string;
	language: string;
}

export function PronunciationPractice({
	conversionId,
	lineIndex,
	text,
	language,
}: PronunciationPracticeProps) {
	const [recording, setRecording] = useState<{
		blob: Blob;
		mimeType: string;
	} | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [result, setResult] = useState<PronunciationAttempt | null>(null);
	const [error, setError] = useState<string | null>(null);

	function handleReRecord() {
		setRecording(null);
		setResult(null);
		setError(null);
	}

	async function handleSubmit() {
		if (!recording) return;
		setSubmitting(true);
		setError(null);
		try {
			const attempt = await assessPronunciation({
				conversionId,
				lineIndex,
				expectedText: text,
				audioBlob: recording.blob,
				mimeType: recording.mimeType,
			});
			setResult(attempt);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Gagal menilai pengucapan.",
			);
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<div className="space-y-3 rounded-xl border border-violet-100 bg-white p-4">
			<AudioRecorder
				onRecorded={(blob, mimeType) => setRecording({ blob, mimeType })}
				onReRecord={handleReRecord}
				disabled={submitting}
			/>

			{recording && !result && (
				<button
					type="button"
					disabled={submitting}
					onClick={handleSubmit}
					className="flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
				>
					{submitting ? (
						<>
							<Loader2 className="h-4 w-4 animate-spin" /> Menilai Pengucapan...
						</>
					) : (
						"Nilai Pengucapan"
					)}
				</button>
			)}

			{error && <p className="text-sm text-red-600">{error}</p>}

			{result && (
				<div className="space-y-3 rounded-lg bg-slate-50 p-3">
					<div className="flex items-center justify-between">
						<span className="text-sm font-medium text-slate-700">Skor</span>
						<span
							className={`text-sm font-bold ${
								result.accuracy_score >= 80
									? "text-emerald-600"
									: result.accuracy_score >= 50
										? "text-amber-600"
										: "text-red-600"
							}`}
						>
							{result.accuracy_score}%
						</span>
					</div>

					<p className="flex flex-wrap gap-x-1.5 gap-y-1 text-base leading-relaxed">
						{result.word_results.map((w, i) => (
							<span
								key={`${i}-${w.word}`}
								className={
									w.correct
										? "text-slate-800"
										: "font-semibold text-red-600 underline decoration-red-300 decoration-2 underline-offset-4"
								}
							>
								{w.word}
							</span>
						))}
					</p>

					<p className="text-xs text-slate-400">
						Kamu terdengar mengucapkan: <em>"{result.transcript}"</em>
					</p>

					<button
						type="button"
						onClick={() => speak(text, language)}
						className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
					>
						<Volume2 className="h-3.5 w-3.5" /> Dengar Pengucapan yang Benar
					</button>
				</div>
			)}
		</div>
	);
}
