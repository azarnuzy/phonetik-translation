import { Volume2 } from "lucide-react";
import {
	overallFeedback,
	scoreTone,
	wpmLabel,
} from "@/lib/pronunciationFeedback";
import type { PronunciationAttempt, WordStatus } from "@/lib/types";

interface PronunciationResultViewProps {
	attempt: PronunciationAttempt;
	onListenCorrect: () => void;
}

function wordClassName(status: WordStatus): string {
	if (status === "correct") return "text-slate-800";
	if (status === "mispronounced") {
		return "font-semibold text-red-600 underline decoration-red-300 decoration-2 underline-offset-4";
	}
	return "font-semibold text-red-400 line-through decoration-2";
}

function ScoreTile({
	label,
	score,
	highlight,
}: {
	label: string;
	score: number | null;
	highlight?: boolean;
}) {
	return (
		<div
			className={`rounded-lg border p-2 text-center ${
				highlight
					? "border-violet-200 bg-violet-50"
					: "border-slate-200 bg-white"
			}`}
		>
			<p className="text-[11px] text-slate-400">{label}</p>
			<p
				className={
					score === null
						? "text-sm text-slate-300"
						: `text-base font-bold ${scoreTone(score)}`
				}
			>
				{score === null ? "-" : `${score}%`}
			</p>
		</div>
	);
}

export function PronunciationResultView({
	attempt,
	onListenCorrect,
}: PronunciationResultViewProps) {
	const feedback = overallFeedback({
		accuracyScore: attempt.accuracy_score,
		completenessScore: attempt.completeness_score,
		overallScore: attempt.overall_score,
	});
	const wpm = wpmLabel(attempt.word_results.length, attempt.duration_seconds);

	return (
		<div className="space-y-3 rounded-lg bg-slate-50 p-3">
			<div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
				<ScoreTile label="Akurasi" score={attempt.accuracy_score} />
				<ScoreTile label="Kelengkapan" score={attempt.completeness_score} />
				<ScoreTile label="Kefasihan" score={attempt.fluency_score} />
				<ScoreTile
					label="Keseluruhan"
					score={attempt.overall_score}
					highlight
				/>
			</div>

			<p className="text-sm text-slate-600">{feedback}</p>
			{wpm && <p className="text-xs text-slate-400">Kecepatan bicara: {wpm}</p>}

			<p className="flex flex-wrap gap-x-1.5 gap-y-1 text-base leading-relaxed">
				{attempt.word_results.map((w, i) => (
					<span key={`${i}-${w.word}`} className={wordClassName(w.status)}>
						{w.word}
					</span>
				))}
			</p>

			{attempt.extra_words.length > 0 && (
				<p className="text-xs text-amber-600">
					Kata tambahan yang terdengar (tidak ada di teks):{" "}
					{attempt.extra_words.join(", ")}
				</p>
			)}

			<p className="text-xs text-slate-400">
				Kamu terdengar mengucapkan: <em>"{attempt.transcript}"</em>
			</p>

			<button
				type="button"
				onClick={onListenCorrect}
				className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
			>
				<Volume2 className="h-3.5 w-3.5" /> Dengar Pengucapan yang Benar
			</button>
		</div>
	);
}
