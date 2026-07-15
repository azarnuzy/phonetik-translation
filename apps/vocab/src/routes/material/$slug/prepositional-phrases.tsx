import { createFileRoute } from "@tanstack/react-router";
import { useCallback } from "react";
import { CardListPage } from "@/components/CardListPage";
import { listPrepositionalPhrases } from "@/lib/api";
import type { PrepositionalPhrase } from "@/lib/types";

export const Route = createFileRoute("/material/$slug/prepositional-phrases")({
	component: PrepositionalPhrasesPage,
});

function PrepositionalPhrasesPage() {
	const { slug } = Route.useParams();
	const load = useCallback(() => listPrepositionalPhrases(slug), [slug]);

	return (
		<CardListPage<PrepositionalPhrase>
			title="Prepositional Phrases"
			slug={slug}
			load={load}
			keyOf={(item) => item.id}
			renderItem={(item) => (
				<>
					<div className="mb-1 text-sm font-semibold text-slate-900">
						{item.phrase}
					</div>
					<p className="text-sm text-slate-600">{item.meaning}</p>
				</>
			)}
		/>
	);
}
