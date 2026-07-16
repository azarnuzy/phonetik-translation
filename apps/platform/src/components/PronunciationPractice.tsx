import { Loader2 } from "lucide-react";
import { useState } from "react";
import { AudioRecorder } from "@/components/AudioRecorder";
import { PronunciationResultView } from "@/components/PronunciationResultView";
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
		durationSeconds: number;
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
				scope: "line",
				lineIndex,
				expectedText: text,
				audioBlob: recording.blob,
				mimeType: recording.mimeType,
				durationSeconds: recording.durationSeconds,
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
				onRecorded={(blob, mimeType, durationSeconds) =>
					setRecording({ blob, mimeType, durationSeconds })
				}
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
				<PronunciationResultView
					attempt={result}
					onListenCorrect={() => speak(text, language)}
				/>
			)}
		</div>
	);
}
