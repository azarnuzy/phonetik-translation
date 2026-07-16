import { Upload } from "lucide-react";
import { type ChangeEvent, useEffect, useRef, useState } from "react";

interface AudioUploadProps {
	onSelected: (blob: Blob, mimeType: string, durationSeconds: number) => void;
	onReset?: () => void;
	disabled?: boolean;
}

export function AudioUpload({
	onSelected,
	onReset,
	disabled,
}: AudioUploadProps) {
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const previewUrlRef = useRef<string | null>(null);
	previewUrlRef.current = previewUrl;

	useEffect(() => {
		return () => {
			if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
		};
	}, []);

	function handleChange(e: ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		e.target.value = "";
		if (!file) return;

		onReset?.();
		setError(null);
		if (previewUrl) URL.revokeObjectURL(previewUrl);

		const url = URL.createObjectURL(file);
		const probe = new Audio();
		probe.addEventListener("loadedmetadata", () => {
			const duration = Number.isFinite(probe.duration) ? probe.duration : 0;
			setPreviewUrl(url);
			onSelected(file, file.type || "audio/mpeg", duration);
		});
		probe.addEventListener("error", () => {
			setError(
				"Gagal membaca file audio. Pastikan formatnya didukung (mp3, wav, m4a, ogg).",
			);
		});
		probe.src = url;
	}

	if (previewUrl) {
		return (
			<div className="space-y-2">
				<div className="flex items-center gap-2">
					{/* biome-ignore lint/a11y/useMediaCaption: user-uploaded speech recording, no dialogue track to caption */}
					<audio controls src={previewUrl} className="h-9 flex-1" />
					<button
						type="button"
						disabled={disabled}
						onClick={() => inputRef.current?.click()}
						className="shrink-0 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
					>
						Ganti File
					</button>
				</div>
				<input
					ref={inputRef}
					type="file"
					accept="audio/*"
					className="hidden"
					onChange={handleChange}
				/>
			</div>
		);
	}

	return (
		<div className="space-y-2">
			<input
				ref={inputRef}
				type="file"
				accept="audio/*"
				className="hidden"
				onChange={handleChange}
			/>
			<button
				type="button"
				disabled={disabled}
				onClick={() => inputRef.current?.click()}
				className="flex w-full items-center justify-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm font-medium text-violet-700 hover:bg-violet-100 disabled:opacity-50"
			>
				<Upload className="h-4 w-4" /> Upload File Audio
			</button>
			{error && <p className="text-xs text-red-600">{error}</p>}
		</div>
	);
}
