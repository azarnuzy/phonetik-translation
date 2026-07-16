import { AlertCircle, Mic, RotateCcw, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { pickSupportedMimeType } from "@/lib/audio";

const MAX_DURATION_SECONDS = 20;

type Phase = "idle" | "requesting" | "recording" | "recorded" | "error";

interface AudioRecorderProps {
	onRecorded: (blob: Blob, mimeType: string) => void;
	onReRecord?: () => void;
	disabled?: boolean;
}

export function AudioRecorder({
	onRecorded,
	onReRecord,
	disabled,
}: AudioRecorderProps) {
	const [phase, setPhase] = useState<Phase>("idle");
	const [error, setError] = useState<string | null>(null);
	const [elapsed, setElapsed] = useState(0);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);

	const streamRef = useRef<MediaStream | null>(null);
	const recorderRef = useRef<MediaRecorder | null>(null);
	const chunksRef = useRef<Blob[]>([]);
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const previewUrlRef = useRef<string | null>(null);
	previewUrlRef.current = previewUrl;

	useEffect(() => {
		return () => {
			for (const track of streamRef.current?.getTracks() ?? []) track.stop();
			if (intervalRef.current) clearInterval(intervalRef.current);
			if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
		};
	}, []);

	function stopTimer() {
		if (intervalRef.current) {
			clearInterval(intervalRef.current);
			intervalRef.current = null;
		}
	}

	async function handleStart() {
		if (previewUrl) URL.revokeObjectURL(previewUrl);
		setPreviewUrl(null);
		onReRecord?.();
		setError(null);
		setPhase("requesting");

		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				audio: true,
			});
			streamRef.current = stream;

			const mimeType = pickSupportedMimeType();
			const recorder = new MediaRecorder(stream, { mimeType });
			recorderRef.current = recorder;
			chunksRef.current = [];

			recorder.ondataavailable = (e) => {
				if (e.data.size > 0) chunksRef.current.push(e.data);
			};
			recorder.onstop = () => {
				stopTimer();
				for (const track of streamRef.current?.getTracks() ?? []) {
					track.stop();
				}
				streamRef.current = null;
				const blob = new Blob(chunksRef.current, { type: mimeType });
				const url = URL.createObjectURL(blob);
				setPreviewUrl(url);
				setPhase("recorded");
				onRecorded(blob, mimeType);
			};

			recorder.start();
			setPhase("recording");
			setElapsed(0);
			intervalRef.current = setInterval(() => {
				setElapsed((prev) => {
					const next = prev + 1;
					if (next >= MAX_DURATION_SECONDS) {
						recorder.stop();
					}
					return next;
				});
			}, 1000);
		} catch {
			setError(
				"Tidak dapat mengakses mikrofon. Pastikan kamu memberikan izin mikrofon pada browser.",
			);
			setPhase("error");
		}
	}

	function handleStop() {
		recorderRef.current?.stop();
	}

	if (phase === "error") {
		return (
			<div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
				<AlertCircle className="h-4 w-4 shrink-0" />
				<span className="flex-1">{error}</span>
				<button
					type="button"
					onClick={handleStart}
					className="shrink-0 font-medium underline"
				>
					Coba Lagi
				</button>
			</div>
		);
	}

	if (phase === "recording") {
		return (
			<button
				type="button"
				onClick={handleStop}
				className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
			>
				<Square className="h-4 w-4 fill-current" />
				Berhenti ({elapsed}s / {MAX_DURATION_SECONDS}s)
			</button>
		);
	}

	if (phase === "recorded" && previewUrl) {
		return (
			<div className="flex items-center gap-2">
				{/* biome-ignore lint/a11y/useMediaCaption: user's own speech recording, no dialogue track to caption */}
				<audio controls src={previewUrl} className="h-9 flex-1" />
				<button
					type="button"
					disabled={disabled}
					onClick={handleStart}
					title="Rekam Ulang"
					className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
				>
					<RotateCcw className="h-4 w-4" />
				</button>
			</div>
		);
	}

	return (
		<button
			type="button"
			disabled={disabled || phase === "requesting"}
			onClick={handleStart}
			className="flex w-full items-center justify-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm font-medium text-violet-700 hover:bg-violet-100 disabled:opacity-50"
		>
			<Mic className="h-4 w-4" />
			{phase === "requesting" ? "Meminta izin mikrofon..." : "Mulai Rekam"}
		</button>
	);
}
