import { Check, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface ImageCropperProps {
	file: File;
	onConfirm: (cropped: File) => void;
	onCancel: () => void;
}

interface CropRect {
	x: number;
	y: number;
	w: number;
	h: number;
}

type DragMode = "move" | "nw" | "ne" | "sw" | "se";

const MIN_SIZE = 10;

function clamp(value: number, min: number, max: number) {
	return Math.min(Math.max(value, min), max);
}

export function ImageCropper({ file, onConfirm, onCancel }: ImageCropperProps) {
	const [imgSrc, setImgSrc] = useState<string | null>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const imgRef = useRef<HTMLImageElement>(null);
	const [crop, setCrop] = useState<CropRect>({ x: 10, y: 10, w: 80, h: 80 });
	const dragRef = useRef<{
		mode: DragMode;
		pointerId: number;
		startX: number;
		startY: number;
		start: CropRect;
	} | null>(null);

	useEffect(() => {
		const url = URL.createObjectURL(file);
		setImgSrc(url);
		return () => URL.revokeObjectURL(url);
	}, [file]);

	function startDrag(mode: DragMode, e: React.PointerEvent) {
		e.preventDefault();
		e.stopPropagation();
		(e.target as HTMLElement).setPointerCapture(e.pointerId);
		dragRef.current = {
			mode,
			pointerId: e.pointerId,
			startX: e.clientX,
			startY: e.clientY,
			start: crop,
		};
	}

	function onPointerMove(e: React.PointerEvent) {
		const drag = dragRef.current;
		const container = containerRef.current;
		if (!drag || !container || drag.pointerId !== e.pointerId) return;

		const rect = container.getBoundingClientRect();
		const dxPct = ((e.clientX - drag.startX) / rect.width) * 100;
		const dyPct = ((e.clientY - drag.startY) / rect.height) * 100;
		const s = drag.start;

		if (drag.mode === "move") {
			setCrop({
				...s,
				x: clamp(s.x + dxPct, 0, 100 - s.w),
				y: clamp(s.y + dyPct, 0, 100 - s.h),
			});
			return;
		}

		let { x, y, w, h } = s;
		if (drag.mode === "se") {
			w = clamp(s.w + dxPct, MIN_SIZE, 100 - s.x);
			h = clamp(s.h + dyPct, MIN_SIZE, 100 - s.y);
		} else if (drag.mode === "sw") {
			x = clamp(s.x + dxPct, 0, s.x + s.w - MIN_SIZE);
			w = s.w - (x - s.x);
			h = clamp(s.h + dyPct, MIN_SIZE, 100 - s.y);
		} else if (drag.mode === "ne") {
			w = clamp(s.w + dxPct, MIN_SIZE, 100 - s.x);
			y = clamp(s.y + dyPct, 0, s.y + s.h - MIN_SIZE);
			h = s.h - (y - s.y);
		} else if (drag.mode === "nw") {
			x = clamp(s.x + dxPct, 0, s.x + s.w - MIN_SIZE);
			w = s.w - (x - s.x);
			y = clamp(s.y + dyPct, 0, s.y + s.h - MIN_SIZE);
			h = s.h - (y - s.y);
		}
		setCrop({ x, y, w, h });
	}

	function endDrag(e: React.PointerEvent) {
		if (dragRef.current?.pointerId === e.pointerId) dragRef.current = null;
	}

	function handleConfirm() {
		const img = imgRef.current;
		if (!img) return;

		const sx = (crop.x / 100) * img.naturalWidth;
		const sy = (crop.y / 100) * img.naturalHeight;
		const sw = (crop.w / 100) * img.naturalWidth;
		const sh = (crop.h / 100) * img.naturalHeight;

		const canvas = document.createElement("canvas");
		canvas.width = Math.round(sw);
		canvas.height = Math.round(sh);
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

		canvas.toBlob(
			(blob) => {
				if (!blob) return;
				onConfirm(
					new File([blob], `crop-${file.name || "foto.jpg"}`, {
						type: "image/jpeg",
					}),
				);
			},
			"image/jpeg",
			0.92,
		);
	}

	const handles: DragMode[] = ["nw", "ne", "sw", "se"];

	return (
		<div className="fixed inset-0 z-50 flex flex-col bg-black">
			<div className="flex items-center justify-between px-4 py-3 text-white">
				<span className="text-sm font-medium">Sesuaikan Crop</span>
				<button
					type="button"
					onClick={onCancel}
					className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/10"
					title="Batal"
				>
					<X className="h-5 w-5" />
				</button>
			</div>

			<div className="flex flex-1 items-center justify-center overflow-auto px-4">
				{imgSrc && (
					<div
						ref={containerRef}
						className="relative w-full max-w-xl touch-none select-none"
						onPointerMove={onPointerMove}
						onPointerUp={endDrag}
					>
						<img
							ref={imgRef}
							src={imgSrc}
							alt="Gambar yang akan di-crop"
							className="block w-full select-none"
							draggable={false}
						/>
						<div
							className="absolute cursor-move border-2 border-violet-400"
							style={{
								left: `${crop.x}%`,
								top: `${crop.y}%`,
								width: `${crop.w}%`,
								height: `${crop.h}%`,
								boxShadow: "0 0 0 9999px rgba(0,0,0,0.6)",
							}}
							onPointerDown={(e) => startDrag("move", e)}
						>
							{handles.map((corner) => (
								<div
									key={corner}
									onPointerDown={(e) => startDrag(corner, e)}
									className={`absolute h-4 w-4 rounded-full border-2 border-violet-500 bg-white ${
										corner === "nw"
											? "-left-2 -top-2 cursor-nwse-resize"
											: corner === "ne"
												? "-right-2 -top-2 cursor-nesw-resize"
												: corner === "sw"
													? "-bottom-2 -left-2 cursor-nesw-resize"
													: "-bottom-2 -right-2 cursor-nwse-resize"
									}`}
								/>
							))}
						</div>
					</div>
				)}
			</div>

			<div className="flex items-center justify-center gap-3 px-4 py-5">
				<button
					type="button"
					onClick={onCancel}
					className="rounded-xl border border-white/30 px-5 py-2.5 text-sm font-medium text-white hover:bg-white/10"
				>
					Batal
				</button>
				<button
					type="button"
					onClick={handleConfirm}
					className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
				>
					<Check className="h-4 w-4" /> Gunakan Foto
				</button>
			</div>
		</div>
	);
}
