import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { PageHeader, PageShell, ProgressBar } from "@/components/PageShell";
import { listVocabulary, setWordLearned, setWordSaved } from "@/lib/api";
import type { VocabularyWord } from "@/lib/types";

export const Route = createFileRoute("/material/$slug/vocabulary")({
	component: VocabularyPage,
});

function VocabularyPage() {
	const { slug } = Route.useParams();
	const [words, setWords] = useState<VocabularyWord[] | null>(null);
	const [index, setIndex] = useState(0);
	const [error, setError] = useState<string | null>(null);
	const [savingId, setSavingId] = useState<string | null>(null);

	useEffect(() => {
		listVocabulary(slug)
			.then(setWords)
			.catch((e) => setError(e.message));
	}, [slug]);

	if (error) {
		return (
			<PageShell>
				<PageHeader title="Topic Vocabulary" backTo={`/material/${slug}`} />
				<p className="text-sm text-red-600">{error}</p>
			</PageShell>
		);
	}

	if (!words || words.length === 0) {
		return (
			<PageShell>
				<PageHeader title="Topic Vocabulary" backTo={`/material/${slug}`} />
				<p className="text-sm text-slate-500">
					{words ? "No words yet." : "Loading…"}
				</p>
			</PageShell>
		);
	}

	const word = words[index];
	const total = words.length;
	const learnedCount = words.filter((w) => w.learned).length;

	async function goNext() {
		if (!word.learned) {
			await setWordLearned(word.id, true).catch(() => {});
			setWords((prev) =>
				prev
					? prev.map((w) => (w.id === word.id ? { ...w, learned: true } : w))
					: prev,
			);
		}
		setIndex((i) => Math.min(i + 1, total - 1));
	}

	async function toggleSave() {
		setSavingId(word.id);
		const next = !word.saved;
		try {
			await setWordSaved(word.id, next);
			setWords((prev) =>
				prev
					? prev.map((w) => (w.id === word.id ? { ...w, saved: next } : w))
					: prev,
			);
		} finally {
			setSavingId(null);
		}
	}

	return (
		<PageShell>
			<PageHeader title="Topic Vocabulary" backTo={`/material/${slug}`} />

			<div className="mb-4">
				<div className="mb-1 flex items-center justify-between text-xs text-slate-500">
					<span>
						Word {index + 1} of {words.length}
					</span>
					<span>{learnedCount} learned</span>
				</div>
				<ProgressBar value={index + 1} max={words.length} />
			</div>

			<div className="rounded-2xl border border-slate-200 bg-white p-6">
				<div className="mb-4 flex items-start justify-between">
					<div>
						<div className="text-xl font-bold text-slate-900">{word.word}</div>
						{word.wordClass && (
							<div className="text-xs font-medium uppercase tracking-wide text-blue-600">
								{word.wordClass}
							</div>
						)}
					</div>
					<button
						type="button"
						onClick={toggleSave}
						disabled={savingId === word.id}
						className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200"
					>
						<Star
							className={`h-4 w-4 ${word.saved ? "fill-amber-400 text-amber-400" : "text-slate-300"}`}
						/>
					</button>
				</div>

				<div className="mb-3">
					<div className="mb-1 text-xs font-semibold text-slate-500">
						Meaning
					</div>
					<p className="text-sm text-slate-700">{word.meaning}</p>
				</div>

				{word.example && (
					<div>
						<div className="mb-1 text-xs font-semibold text-slate-500">
							Example
						</div>
						<p className="text-sm italic text-slate-600">{word.example}</p>
					</div>
				)}
			</div>

			<div className="mt-4 flex gap-3">
				<button
					type="button"
					onClick={() => setIndex((i) => Math.max(i - 1, 0))}
					disabled={index === 0}
					className="flex flex-1 items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-600 disabled:opacity-40"
				>
					<ChevronLeft className="h-4 w-4" /> Prev
				</button>
				<button
					type="button"
					onClick={goNext}
					disabled={index === words.length - 1 && word.learned}
					className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
				>
					Next <ChevronRight className="h-4 w-4" />
				</button>
			</div>
		</PageShell>
	);
}
