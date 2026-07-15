import { createFileRoute } from "@tanstack/react-router";
import {
	Camera,
	CheckCircle2,
	Circle,
	Crop,
	ImagePlus,
	Loader2,
	Sparkles,
} from "lucide-react";
import {
	type ChangeEvent,
	type DragEvent,
	type RefObject,
	useEffect,
	useRef,
	useState,
} from "react";
import { CameraCapture } from "@/components/CameraCapture";
import { ConversionResult } from "@/components/ConversionResult";
import { ImageCropper } from "@/components/ImageCropper";
import { Layout } from "@/components/Layout";
import { processImage, setFavorite } from "@/lib/api";
import type { Conversion } from "@/lib/types";

export const Route = createFileRoute("/")({ component: BerandaPage });

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const PROCESSING_STEPS = [
	{ title: "Mengenali teks (OCR)", subtitle: "Membaca teks dari gambar..." },
	{
		title: "Menganalisis struktur kalimat",
		subtitle: "Memahami kalimat dan tanda baca...",
	},
	{
		title: "Mengonversi ke fonetik (IPA)",
		subtitle: "Mengubah teks menjadi fonetik (IPA)...",
	},
];

type Stage = "upload" | "processing" | "result" | "error";

function BerandaPage() {
	const [stage, setStage] = useState<Stage>("upload");
	const [file, setFile] = useState<File | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [validationError, setValidationError] = useState<string | null>(null);
	const [processingError, setProcessingError] = useState<string | null>(null);
	const [visualStep, setVisualStep] = useState(0);
	const [conversion, setConversion] = useState<Conversion | null>(null);
	const [favoriteBusy, setFavoriteBusy] = useState(false);
	const [cameraOpen, setCameraOpen] = useState(false);
	const [cropTarget, setCropTarget] = useState<File | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		return () => {
			if (previewUrl) URL.revokeObjectURL(previewUrl);
		};
	}, [previewUrl]);

	function acceptFile(candidate: File) {
		if (previewUrl) URL.revokeObjectURL(previewUrl);
		setFile(candidate);
		setPreviewUrl(URL.createObjectURL(candidate));
	}

	function beginCrop(candidate: File) {
		if (!ALLOWED_TYPES.includes(candidate.type)) {
			setValidationError("Format tidak didukung. Gunakan JPG, PNG, atau WebP.");
			return;
		}
		if (candidate.size > MAX_FILE_BYTES) {
			setValidationError("Ukuran file maksimal 5MB.");
			return;
		}
		setValidationError(null);
		setCropTarget(candidate);
	}

	function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
		const candidate = e.target.files?.[0];
		if (candidate) beginCrop(candidate);
		e.target.value = "";
	}

	function handleDrop(e: DragEvent<HTMLButtonElement>) {
		e.preventDefault();
		const candidate = e.dataTransfer.files?.[0];
		if (candidate) beginCrop(candidate);
	}

	function handleCameraCapture(captured: File) {
		setCameraOpen(false);
		beginCrop(captured);
	}

	function handleCropConfirm(cropped: File) {
		setCropTarget(null);
		acceptFile(cropped);
	}

	async function handleProcess() {
		if (!file) return;
		setStage("processing");
		setProcessingError(null);
		setVisualStep(0);

		const t1 = setTimeout(() => setVisualStep(1), 900);
		const t2 = setTimeout(() => setVisualStep(2), 1800);

		try {
			const result = await processImage(file, "en-US");
			clearTimeout(t1);
			clearTimeout(t2);
			setVisualStep(3);
			setConversion(result);
			setTimeout(() => setStage("result"), 400);
		} catch (err) {
			clearTimeout(t1);
			clearTimeout(t2);
			setProcessingError(
				err instanceof Error ? err.message : "Terjadi kesalahan.",
			);
			setStage("error");
		}
	}

	function handleReset() {
		setStage("upload");
		setFile(null);
		if (previewUrl) URL.revokeObjectURL(previewUrl);
		setPreviewUrl(null);
		setConversion(null);
		setProcessingError(null);
	}

	async function handleToggleFavorite(next: boolean) {
		if (!conversion) return;
		setFavoriteBusy(true);
		try {
			await setFavorite(conversion.id, next);
			setConversion({ ...conversion, is_favorite: next });
		} finally {
			setFavoriteBusy(false);
		}
	}

	return (
		<Layout>
			{stage === "upload" && (
				<UploadStep
					file={file}
					previewUrl={previewUrl}
					validationError={validationError}
					fileInputRef={fileInputRef}
					onInputChange={handleInputChange}
					onDrop={handleDrop}
					onProcess={handleProcess}
					onOpenCamera={() => setCameraOpen(true)}
					onRecrop={() => file && setCropTarget(file)}
				/>
			)}

			{cameraOpen && (
				<CameraCapture
					onCapture={handleCameraCapture}
					onClose={() => setCameraOpen(false)}
				/>
			)}

			{cropTarget && (
				<ImageCropper
					file={cropTarget}
					onConfirm={handleCropConfirm}
					onCancel={() => setCropTarget(null)}
				/>
			)}

			{stage === "processing" && (
				<ProcessingStep previewUrl={previewUrl} visualStep={visualStep} />
			)}

			{stage === "error" && (
				<ErrorStep
					message={processingError}
					onRetry={() => setStage("upload")}
				/>
			)}

			{stage === "result" && conversion && (
				<div className="space-y-6">
					<ConversionResult
						conversion={conversion}
						onToggleFavorite={handleToggleFavorite}
						favoriteBusy={favoriteBusy}
					/>
					<button
						type="button"
						onClick={handleReset}
						className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
					>
						Proses Foto Lain
					</button>
				</div>
			)}
		</Layout>
	);
}

function UploadStep({
	file,
	previewUrl,
	validationError,
	fileInputRef,
	onInputChange,
	onDrop,
	onProcess,
	onOpenCamera,
	onRecrop,
}: {
	file: File | null;
	previewUrl: string | null;
	validationError: string | null;
	fileInputRef: RefObject<HTMLInputElement | null>;
	onInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
	onDrop: (e: DragEvent<HTMLButtonElement>) => void;
	onProcess: () => void;
	onOpenCamera: () => void;
	onRecrop: () => void;
}) {
	return (
		<div className="space-y-5">
			<StepBadge n={1} />
			<div>
				<h1 className="text-2xl font-bold text-slate-900">
					Ubah Paragraf Menjadi <span className="text-violet-600">Fonetik</span>
				</h1>
				<p className="mt-1 text-sm text-slate-500">
					Upload foto paragraf dari buku, dan dapatkan transkripsi fonetiknya
					secara otomatis.
				</p>
			</div>

			<input
				ref={fileInputRef}
				type="file"
				accept="image/jpeg,image/png,image/webp"
				className="hidden"
				onChange={onInputChange}
			/>

			<button
				type="button"
				onClick={() => fileInputRef.current?.click()}
				onDragOver={(e) => e.preventDefault()}
				onDrop={onDrop}
				className="flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-violet-200 bg-violet-50/40 px-6 py-12 text-center hover:bg-violet-50"
			>
				{previewUrl ? (
					<img
						src={previewUrl}
						alt="Pratinjau paragraf"
						className="max-h-56 rounded-lg object-contain"
					/>
				) : (
					<>
						<span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
							<ImagePlus className="h-7 w-7" />
						</span>
						<span className="text-base font-medium text-slate-800">
							Upload Foto Paragraf
						</span>
						<span className="text-sm text-slate-500">
							Klik atau seret foto ke sini
						</span>
						<span className="text-xs text-slate-400">
							Format: JPG, PNG, WebP (Maks. 5MB)
						</span>
					</>
				)}
			</button>

			{file && !validationError && (
				<div className="flex items-center justify-center gap-2 text-xs text-slate-400">
					<span className="truncate">{file.name}</span>
					<button
						type="button"
						onClick={onRecrop}
						className="flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 font-medium text-violet-600 hover:bg-violet-50"
					>
						<Crop className="h-3 w-3" /> Crop Ulang
					</button>
				</div>
			)}
			{validationError && (
				<p className="text-center text-sm text-red-600">{validationError}</p>
			)}

			<div className="flex items-center gap-3 text-xs text-slate-400">
				<span className="h-px flex-1 bg-slate-200" />
				atau
				<span className="h-px flex-1 bg-slate-200" />
			</div>

			<div className="grid grid-cols-2 gap-3">
				<button
					type="button"
					onClick={() => fileInputRef.current?.click()}
					className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
				>
					<ImagePlus className="h-4 w-4" /> Pilih dari Galeri
				</button>
				<button
					type="button"
					onClick={onOpenCamera}
					className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
				>
					<Camera className="h-4 w-4" /> Ambil Foto
				</button>
			</div>

			<div>
				<label
					htmlFor="language"
					className="mb-1 block text-sm font-medium text-slate-700"
				>
					Bahasa Hasil Fonetik
				</label>
				<select
					id="language"
					defaultValue="en-US"
					className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
				>
					<option value="en-US">English (US)</option>
				</select>
				<p className="mt-1 text-xs text-slate-400">
					Kamu bisa mengubah bahasa di halaman hasil
				</p>
			</div>

			<button
				type="button"
				disabled={!file}
				onClick={onProcess}
				className="w-full rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
			>
				&rarr; Proses Sekarang
			</button>

			<p className="text-center text-xs text-slate-400">
				Foto yang kamu upload hanya digunakan untuk proses konversi dan tidak
				disimpan.
			</p>
		</div>
	);
}

function ProcessingStep({
	previewUrl,
	visualStep,
}: {
	previewUrl: string | null;
	visualStep: number;
}) {
	return (
		<div className="space-y-5">
			<StepBadge n={2} />
			<div>
				<h1 className="text-2xl font-bold text-slate-900">Memproses Gambar</h1>
				<p className="mt-1 text-sm text-slate-500">
					Mohon tunggu sebentar, kami sedang mengenali teks dan membuat
					transkripsi fonetik.
				</p>
			</div>

			{previewUrl && (
				<img
					src={previewUrl}
					alt="Paragraf yang diproses"
					className="max-h-64 w-full rounded-xl border border-slate-200 object-contain"
				/>
			)}

			<ul className="space-y-2">
				{PROCESSING_STEPS.map((step, i) => {
					const status =
						i < visualStep ? "done" : i === visualStep ? "active" : "pending";
					return (
						<li
							key={step.title}
							className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3"
						>
							<span
								className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
									status === "pending"
										? "bg-slate-100 text-slate-400"
										: "bg-violet-600 text-white"
								}`}
							>
								<Sparkles className="h-4 w-4" />
							</span>
							<span className="flex-1">
								<span className="block text-sm font-medium text-slate-800">
									{step.title}
								</span>
								<span className="block text-xs text-slate-500">
									{step.subtitle}
								</span>
							</span>
							{status === "done" && (
								<CheckCircle2 className="h-5 w-5 text-emerald-500" />
							)}
							{status === "active" && (
								<Loader2 className="h-5 w-5 animate-spin text-violet-500" />
							)}
							{status === "pending" && (
								<Circle className="h-5 w-5 text-slate-300" />
							)}
						</li>
					);
				})}
			</ul>

			<div className="rounded-xl bg-violet-50 px-4 py-3 text-sm text-violet-700">
				<span className="font-medium">Tips: </span>
				Hasil fonetik menggunakan International Phonetic Alphabet (IPA) untuk
				representasi pengucapan paling akurat.
			</div>
		</div>
	);
}

function ErrorStep({
	message,
	onRetry,
}: {
	message: string | null;
	onRetry: () => void;
}) {
	return (
		<div className="space-y-4 rounded-xl border border-red-200 bg-red-50 p-6 text-center">
			<h2 className="text-lg font-semibold text-red-700">
				Gagal Memproses Gambar
			</h2>
			<p className="text-sm text-red-600">
				{message ?? "Terjadi kesalahan tak terduga."}
			</p>
			<button
				type="button"
				onClick={onRetry}
				className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
			>
				Coba Lagi
			</button>
		</div>
	);
}

function StepBadge({ n }: { n: number }) {
	return (
		<span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 text-sm font-semibold text-white">
			{n}
		</span>
	);
}
