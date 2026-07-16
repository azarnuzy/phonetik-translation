import { Copy, Download, Heart, Mic, Square, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { OverallPronunciationPractice } from "@/components/OverallPronunciationPractice";
import { PronunciationPractice } from "@/components/PronunciationPractice";
import {
	copyToClipboard,
	downloadTextFile,
	speak,
	speakAll,
	stopSpeaking,
} from "@/lib/clientUtils";
import type { Conversion } from "@/lib/types";

interface ConversionResultProps {
	conversion: Conversion;
	onToggleFavorite?: (next: boolean) => void;
	favoriteBusy?: boolean;
}

export function ConversionResult({
	conversion,
	onToggleFavorite,
	favoriteBusy,
}: ConversionResultProps) {
	const [copiedAll, setCopiedAll] = useState(false);
	const [copiedOriginal, setCopiedOriginal] = useState(false);
	const [speakingTarget, setSpeakingTarget] = useState<"all" | number | null>(
		null,
	);
	const [practiceIndex, setPracticeIndex] = useState<number | null>(null);
	const speechTokenRef = useRef(0);

	const lines = conversion.ipa_lines;

	useEffect(() => {
		return () => {
			speechTokenRef.current++;
			stopSpeaking();
		};
	}, []);

	function stopCurrentSpeech() {
		speechTokenRef.current++;
		stopSpeaking();
		setSpeakingTarget(null);
	}

	function handleSpeakAll() {
		if (speakingTarget !== null) {
			stopCurrentSpeech();
			return;
		}
		const token = ++speechTokenRef.current;
		setSpeakingTarget("all");
		speakAll(
			lines.map((l) => l.text),
			conversion.language,
			() => {
				if (speechTokenRef.current === token) setSpeakingTarget(null);
			},
		);
	}

	function handleSpeakLine(i: number, text: string) {
		if (speakingTarget === i) {
			stopCurrentSpeech();
			return;
		}
		const token = ++speechTokenRef.current;
		setSpeakingTarget(i);
		speak(text, conversion.language, () => {
			if (speechTokenRef.current === token) setSpeakingTarget(null);
		});
	}

	async function handleCopyAll() {
		const ok = await copyToClipboard(lines.map((l) => l.ipa).join("\n"));
		if (ok) {
			setCopiedAll(true);
			setTimeout(() => setCopiedAll(false), 1500);
		}
	}

	async function handleCopyOriginal() {
		const ok = await copyToClipboard(conversion.original_text);
		if (ok) {
			setCopiedOriginal(true);
			setTimeout(() => setCopiedOriginal(false), 1500);
		}
	}

	function handleSave() {
		const content = `${conversion.original_text}\n\n--- Fonetik (IPA) ---\n${lines
			.map((l) => l.ipa)
			.join("\n")}`;
		downloadTextFile(`phonetik-${conversion.id.slice(0, 8)}.txt`, content);
	}

	return (
		<section className="space-y-4">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h2 className="text-lg font-semibold text-slate-900">
						Hasil Fonetik
					</h2>
					<p className="text-sm text-slate-500">
						Berikut adalah hasil fonetik berdasarkan teks pada gambar.
					</p>
				</div>
				<div className="flex gap-2">
					<button
						type="button"
						onClick={handleSpeakAll}
						className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
					>
						{speakingTarget !== null ? (
							<>
								<Square className="h-4 w-4 fill-current" /> Stop
							</>
						) : (
							<>
								<Volume2 className="h-4 w-4" /> Dengarkan Semua
							</>
						)}
					</button>
					<button
						type="button"
						onClick={handleCopyAll}
						className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
					>
						<Copy className="h-4 w-4" />{" "}
						{copiedAll ? "Tersalin!" : "Salin Semua"}
					</button>
				</div>
			</div>

			<div className="rounded-xl border border-violet-100 bg-violet-50/50 p-5">
				<h3 className="mb-3 text-xs font-semibold tracking-wide text-violet-400 uppercase">
					Fonetik (IPA)
				</h3>
				<ul className="space-y-3">
					{lines.map((line, i) => (
						<li key={`${i}-${line.text.slice(0, 16)}`} className="space-y-2">
							<div className="flex items-start justify-between gap-3">
								<span className="font-mono text-base text-violet-700">
									{line.ipa}
								</span>
								<div className="flex shrink-0 items-center gap-1.5">
									<button
										type="button"
										title={
											speakingTarget === i
												? "Klik untuk menghentikan"
												: "Klik untuk mendengarkan"
										}
										onClick={() => handleSpeakLine(i, line.text)}
										className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-600 hover:bg-violet-200"
									>
										{speakingTarget === i ? (
											<Square className="h-4 w-4 fill-current" />
										) : (
											<Volume2 className="h-4 w-4" />
										)}
									</button>
									<button
										type="button"
										title="Latih Pengucapan"
										onClick={() =>
											setPracticeIndex(practiceIndex === i ? null : i)
										}
										className={
											practiceIndex === i
												? "flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 text-white"
												: "flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-600 hover:bg-violet-200"
										}
									>
										<Mic className="h-4 w-4" />
									</button>
								</div>
							</div>

							{practiceIndex === i && (
								<PronunciationPractice
									conversionId={conversion.id}
									lineIndex={i}
									text={line.text}
									language={conversion.language}
								/>
							)}
						</li>
					))}
				</ul>
			</div>

			<div className="rounded-xl border border-slate-200 p-5">
				<div className="mb-3 flex items-center justify-between">
					<h3 className="text-sm font-semibold text-slate-900">
						Teks Asli (Hasil OCR)
					</h3>
					<button
						type="button"
						onClick={handleCopyOriginal}
						className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
					>
						<Copy className="h-3.5 w-3.5" />{" "}
						{copiedOriginal ? "Tersalin!" : "Salin"}
					</button>
				</div>
				<p className="text-sm leading-relaxed whitespace-pre-line text-slate-600">
					{conversion.original_text}
				</p>
			</div>

			<OverallPronunciationPractice conversion={conversion} />

			<div className="flex items-end gap-3">
				<div className="flex-1">
					<label
						htmlFor="result-language"
						className="mb-1 block text-xs text-slate-500"
					>
						Bahasa
					</label>
					<select
						id="result-language"
						disabled
						value={conversion.language}
						className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
					>
						<option value="en-US">English (US)</option>
					</select>
				</div>
				<button
					type="button"
					onClick={handleSave}
					className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
				>
					<Download className="h-4 w-4" /> Simpan Hasil
				</button>
			</div>

			{onToggleFavorite && (
				<button
					type="button"
					disabled={favoriteBusy}
					onClick={() => onToggleFavorite(!conversion.is_favorite)}
					className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
				>
					<Heart
						className={
							conversion.is_favorite ? "h-4 w-4 fill-white" : "h-4 w-4"
						}
					/>
					{conversion.is_favorite
						? "Tersimpan di Favorit"
						: "Simpan ke Favorit"}
				</button>
			)}
		</section>
	);
}
