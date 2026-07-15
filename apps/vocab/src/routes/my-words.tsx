import { createFileRoute } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { useEffect, useState } from "react";
import { PageHeader, PageShell } from "@/components/PageShell";
import { listMyWords, setWordSaved } from "@/lib/api";
import type { MyWord } from "@/lib/types";

export const Route = createFileRoute("/my-words")({ component: MyWordsPage });

function MyWordsPage() {
	const [words, setWords] = useState<MyWord[] | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		listMyWords()
			.then(setWords)
			.catch((e) => setError(e.message));
	}, []);

	async function remove(id: string) {
		await setWordSaved(id, false).catch(() => {});
		setWords((prev) => (prev ? prev.filter((w) => w.id !== id) : prev));
	}

	return (
		<PageShell>
			<PageHeader title="My Words" backTo="/profile" />

			{error && <p className="text-sm text-red-600">{error}</p>}
			{words?.length === 0 && (
				<p className="text-sm text-slate-500">
					No saved words yet. Tap the star on a word to save it here.
				</p>
			)}

			<div className="space-y-3">
				{words?.map((w) => (
					<div
						key={w.id}
						className="rounded-xl border border-slate-200 bg-white p-4"
					>
						<div className="mb-1 flex items-start justify-between">
							<div>
								<div className="text-sm font-semibold text-slate-900">
									{w.word}
								</div>
								<div className="text-xs text-slate-400">
									{w.discourse.title}
								</div>
							</div>
							<button
								type="button"
								onClick={() => remove(w.id)}
								className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200"
							>
								<Star className="h-4 w-4 fill-amber-400 text-amber-400" />
							</button>
						</div>
						<p className="text-sm text-slate-600">{w.meaning}</p>
						{w.example && (
							<p className="mt-1 text-sm italic text-slate-500">{w.example}</p>
						)}
					</div>
				))}
			</div>
		</PageShell>
	);
}
