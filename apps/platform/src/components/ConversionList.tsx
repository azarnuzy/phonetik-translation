import { Heart, History as HistoryIcon, Loader2, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { ConversionResult } from "@/components/ConversionResult";
import { deleteConversion, listConversions, setFavorite } from "@/lib/api";
import type { Conversion } from "@/lib/types";

interface ConversionListProps {
	onlyFavorites: boolean;
	emptyTitle: string;
	emptySubtitle: string;
}

export function ConversionList({
	onlyFavorites,
	emptyTitle,
	emptySubtitle,
}: ConversionListProps) {
	const [conversions, setConversions] = useState<Conversion[] | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [expandedId, setExpandedId] = useState<string | null>(null);
	const [busyId, setBusyId] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		listConversions(onlyFavorites)
			.then((data) => {
				if (!cancelled) setConversions(data);
			})
			.catch((err) => {
				if (!cancelled)
					setError(err instanceof Error ? err.message : "Gagal memuat data.");
			});
		return () => {
			cancelled = true;
		};
	}, [onlyFavorites]);

	async function handleToggleFavorite(item: Conversion) {
		setBusyId(item.id);
		try {
			const next = !item.is_favorite;
			await setFavorite(item.id, next);
			setConversions((prev) => {
				if (!prev) return prev;
				if (onlyFavorites && !next) {
					return prev.filter((c) => c.id !== item.id);
				}
				return prev.map((c) =>
					c.id === item.id ? { ...c, is_favorite: next } : c,
				);
			});
		} finally {
			setBusyId(null);
		}
	}

	async function handleDelete(item: Conversion) {
		setBusyId(item.id);
		try {
			await deleteConversion(item.id);
			setConversions((prev) => prev?.filter((c) => c.id !== item.id) ?? prev);
			if (expandedId === item.id) setExpandedId(null);
		} finally {
			setBusyId(null);
		}
	}

	if (error) {
		return <p className="text-sm text-red-600">{error}</p>;
	}

	if (conversions === null) {
		return (
			<div className="flex items-center justify-center gap-2 py-12 text-slate-400">
				<Loader2 className="h-5 w-5 animate-spin" /> Memuat...
			</div>
		);
	}

	if (conversions.length === 0) {
		return (
			<div className="rounded-xl border border-dashed border-slate-200 py-16 text-center">
				<HistoryIcon className="mx-auto mb-3 h-10 w-10 text-slate-300" />
				<p className="font-medium text-slate-700">{emptyTitle}</p>
				<p className="mt-1 text-sm text-slate-400">{emptySubtitle}</p>
			</div>
		);
	}

	return (
		<ul className="space-y-3">
			{conversions.map((item) => {
				const isExpanded = expandedId === item.id;
				const isBusy = busyId === item.id;
				return (
					<li key={item.id} className="rounded-xl border border-slate-200">
						<div className="flex w-full items-start justify-between gap-3 px-4 py-3">
							<button
								type="button"
								onClick={() => setExpandedId(isExpanded ? null : item.id)}
								className="min-w-0 flex-1 text-left"
							>
								<p className="truncate text-sm font-medium text-slate-800">
									{item.original_text}
								</p>
								<p className="mt-1 text-xs text-slate-400">
									{new Date(item.created_at).toLocaleString("id-ID", {
										dateStyle: "medium",
										timeStyle: "short",
									})}
								</p>
							</button>
							<div className="flex shrink-0 items-center gap-1">
								<button
									type="button"
									disabled={isBusy}
									onClick={() => handleToggleFavorite(item)}
									className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-50 hover:text-violet-600 disabled:opacity-50"
								>
									<Heart
										className={
											item.is_favorite
												? "h-4 w-4 fill-violet-600 text-violet-600"
												: "h-4 w-4"
										}
									/>
								</button>
								<button
									type="button"
									disabled={isBusy}
									onClick={() => handleDelete(item)}
									className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
								>
									<Trash2 className="h-4 w-4" />
								</button>
							</div>
						</div>

						{isExpanded && (
							<div className="border-t border-slate-100 px-4 py-4">
								<ConversionResult
									conversion={item}
									onToggleFavorite={() => handleToggleFavorite(item)}
									favoriteBusy={isBusy}
								/>
							</div>
						)}
					</li>
				);
			})}
		</ul>
	);
}
