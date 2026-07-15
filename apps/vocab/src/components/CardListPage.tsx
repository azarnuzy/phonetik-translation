import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { PageHeader, PageShell } from "@/components/PageShell";

export function CardListPage<T>({
	title,
	slug,
	load,
	renderItem,
	keyOf,
}: {
	title: string;
	/** Discourse slug -- back and "Next" both return to that discourse's detail page. */
	slug: string;
	load: () => Promise<T[]>;
	renderItem: (item: T) => ReactNode;
	keyOf: (item: T) => string;
}) {
	const [items, setItems] = useState<T[] | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		load()
			.then(setItems)
			.catch((e) => setError(e.message));
	}, [load]);

	return (
		<PageShell>
			<PageHeader title={title} backTo={`/material/${slug}`} />

			{error && <p className="text-sm text-red-600">{error}</p>}
			{!error && !items && <p className="text-sm text-slate-500">Loading…</p>}
			{items?.length === 0 && (
				<p className="text-sm text-slate-500">Nothing here yet.</p>
			)}

			<div className="space-y-3">
				{items?.map((item) => (
					<div
						key={keyOf(item)}
						className="rounded-xl border border-slate-200 bg-white p-4"
					>
						{renderItem(item)}
					</div>
				))}
			</div>

			{items && items.length > 0 && (
				<Link
					to="/material/$slug"
					params={{ slug }}
					className="mt-6 block w-full rounded-xl bg-blue-600 py-2.5 text-center text-sm font-semibold text-white"
				>
					Next
				</Link>
			)}
		</PageShell>
	);
}
