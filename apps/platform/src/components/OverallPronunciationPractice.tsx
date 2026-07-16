import { Loader2, Mic, Upload } from "lucide-react";
import { type ComponentType, useState } from "react";
import { AudioRecorder } from "@/components/AudioRecorder";
import { AudioUpload } from "@/components/AudioUpload";
import { PronunciationResultView } from "@/components/PronunciationResultView";
import { assessPronunciation } from "@/lib/api";
import { speak } from "@/lib/clientUtils";
import type { Conversion, PronunciationAttempt } from "@/lib/types";

interface OverallPronunciationPracticeProps {
	conversion: Conversion;
}

type Mode = "record" | "upload";

const MAX_OVERALL_RECORDING_SECONDS = 90;

export function OverallPronunciationPractice({
	conversion,
}: OverallPronunciationPracticeProps) {
	const [mode, setMode] = useState<Mode>("record");
	const [audio, setAudio] = useState<{
		blob: Blob;
		mimeType: string;
		durationSeconds: number;
	} | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [result, setResult] = useState<PronunciationAttempt | null>(null);
	const [error, setError] = useState<string | null>(null);

	function handleReset() {
		setAudio(null);
		setResult(null);
		setError(null);
	}

	function handleModeChange(next: Mode) {
		if (next === mode) return;
		setMode(next);
		handleReset();
	}

	async function handleSubmit() {
		if (!audio) return;
		setSubmitting(true);
		setError(null);
		try {
			const attempt = await assessPronunciation({
				conversionId: conversion.id,
				scope: "overall",
				expectedText: conversion.original_text,
				language: conversion.language,
				audioBlob: audio.blob,
				mimeType: audio.mimeType,
				durationSeconds: audio.durationSeconds,
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
		<div className="space-y-3 rounded-xl border border-slate-200 p-5">
			<div>
				<h3 className="text-sm font-semibold text-slate-900">
					Nilai Pengucapan Keseluruhan
				</h3>
				<p className="mt-1 text-xs text-slate-500">
					Rekam atau upload audio kamu membaca seluruh paragraf di atas untuk
					dinilai secara utuh.
				</p>
			</div>

			<div className="flex gap-2">
				<ModeButton
					active={mode === "record"}
					icon={Mic}
					label="Rekam"
					onClick={() => handleModeChange("record")}
				/>
				<ModeButton
					active={mode === "upload"}
					icon={Upload}
					label="Upload File"
					onClick={() => handleModeChange("upload")}
				/>
			</div>

			{mode === "record" ? (
				<AudioRecorder
					maxDurationSeconds={MAX_OVERALL_RECORDING_SECONDS}
					onRecorded={(blob, mimeType, durationSeconds) =>
						setAudio({ blob, mimeType, durationSeconds })
					}
					onReRecord={handleReset}
					disabled={submitting}
				/>
			) : (
				<AudioUpload
					onSelected={(blob, mimeType, durationSeconds) =>
						setAudio({ blob, mimeType, durationSeconds })
					}
					onReset={handleReset}
					disabled={submitting}
				/>
			)}

			{audio && !result && (
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
					onListenCorrect={() =>
						speak(conversion.original_text, conversion.language)
					}
				/>
			)}
		</div>
	);
}

function ModeButton({
	active,
	icon: Icon,
	label,
	onClick,
}: {
	active: boolean;
	icon: ComponentType<{ className?: string }>;
	label: string;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={
				active
					? "flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white"
					: "flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
			}
		>
			<Icon className="h-4 w-4" />
			{label}
		</button>
	);
}
