import { createFileRoute } from "@tanstack/react-router";
import { useCallback } from "react";
import { CardListPage } from "@/components/CardListPage";
import { listWordPatterns } from "@/lib/api";
import type { WordPattern } from "@/lib/types";

export const Route = createFileRoute("/material/$slug/word-patterns")({
	component: WordPatternsPage,
});

const categoryLabel: Record<WordPattern["category"], string> = {
	ADJECTIVE: "Adjective",
	VERB: "Verb",
	NOUN: "Noun",
};

function WordPatternsPage() {
	const { slug } = Route.useParams();
	const load = useCallback(() => listWordPatterns(slug), [slug]);

	return (
		<CardListPage<WordPattern>
			title="Word Patterns"
			slug={slug}
			load={load}
			keyOf={(item) => item.id}
			renderItem={(item) => (
				<>
					<div className="mb-1 text-xs font-semibold uppercase tracking-wide text-blue-600">
						{categoryLabel[item.category]}
					</div>
					<div className="mb-1 text-sm font-semibold text-slate-900">
						{item.pattern}
					</div>
					{item.meaning && (
						<p className="text-sm text-slate-600">{item.meaning}</p>
					)}
				</>
			)}
		/>
	);
}
