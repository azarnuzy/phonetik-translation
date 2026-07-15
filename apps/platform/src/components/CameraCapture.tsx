import { AlertCircle, Aperture, SwitchCamera, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface CameraCaptureProps {
	onCapture: (file: File) => void;
	onClose: () => void;
}

export function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
	const videoRef = useRef<HTMLVideoElement>(null);
	const streamRef = useRef<MediaStream | null>(null);
	const [facingMode, setFacingMode] = useState<"environment" | "user">(
		"environment",
	);
	const [error, setError] = useState<string | null>(null);
	const [ready, setReady] = useState(false);

	useEffect(() => {
		let cancelled = false;
		setReady(false);
		setError(null);

		async function start() {
			try {
				const stream = await navigator.mediaDevices.getUserMedia({
					video: { facingMode },
					audio: false,
				});
				if (cancelled) {
					for (const track of stream.getTracks()) track.stop();
					return;
				}
				streamRef.current = stream;
				if (videoRef.current) {
					videoRef.current.srcObject = stream;
					await videoRef.current.play();
				}
				setReady(true);
			} catch {
				if (!cancelled) {
					setError(
						"Tidak dapat mengakses kamera. Pastikan kamu memberikan izin kamera pada browser.",
					);
				}
			}
		}

		start();

		return () => {
			cancelled = true;
			for (const track of streamRef.current?.getTracks() ?? []) track.stop();
			streamRef.current = null;
		};
	}, [facingMode]);

	function handleCapture() {
		const video = videoRef.current;
		if (!video || !video.videoWidth) return;

		const canvas = document.createElement("canvas");
		canvas.width = video.videoWidth;
		canvas.height = video.videoHeight;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

		canvas.toBlob(
			(blob) => {
				if (!blob) return;
				onCapture(
					new File([blob], `foto-${Date.now()}.jpg`, {
						type: "image/jpeg",
					}),
				);
			},
			"image/jpeg",
			0.92,
		);
	}

	return (
		<div className="fixed inset-0 z-50 flex flex-col bg-black">
			<div className="flex items-center justify-between px-4 py-3 text-white">
				<span className="text-sm font-medium">Ambil Foto</span>
				<div className="flex items-center gap-1">
					<button
						type="button"
						onClick={() =>
							setFacingMode((m) =>
								m === "environment" ? "user" : "environment",
							)
						}
						className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/10"
						title="Ganti Kamera"
					>
						<SwitchCamera className="h-5 w-5" />
					</button>
					<button
						type="button"
						onClick={onClose}
						className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/10"
						title="Tutup"
					>
						<X className="h-5 w-5" />
					</button>
				</div>
			</div>

			<div className="relative flex flex-1 items-center justify-center overflow-hidden">
				{error ? (
					<div className="mx-6 max-w-sm space-y-3 text-center text-white">
						<AlertCircle className="mx-auto h-10 w-10 text-red-400" />
						<p className="text-sm">{error}</p>
						<button
							type="button"
							onClick={onClose}
							className="rounded-lg border border-white/30 px-4 py-2 text-sm font-medium hover:bg-white/10"
						>
							Tutup
						</button>
					</div>
				) : (
					<video
						ref={videoRef}
						className="h-full w-full object-contain"
						playsInline
						muted
					/>
				)}
			</div>

			{!error && (
				<div className="flex items-center justify-center py-6">
					<button
						type="button"
						disabled={!ready}
						onClick={handleCapture}
						className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-white/20 text-white disabled:opacity-40"
					>
						<Aperture className="h-7 w-7" />
					</button>
				</div>
			)}
		</div>
	);
}
