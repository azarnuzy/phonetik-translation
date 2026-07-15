import { createFileRoute } from "@tanstack/react-router";
import { useCallback } from "react";
import { CardListPage } from "@/components/CardListPage";
import { listWordFormation } from "@/lib/api";
import type { WordFormationEntry } from "@/lib/types";

export const Route = createFileRoute("/material/$slug/word-formation")({
	component: WordFormationPage,
});

function WordFormationPage() {
	const { slug } = Route.useParams();
	const load = useCallback(() => listWordFormation(slug), [slug]);

	return (
		<CardListPage<WordFormationEntry>
			title="Word Formation"
			slug={slug}
			load={load}
			keyOf={(item) => item.id}
			renderItem={(item) => (
				<>
					<div className="mb-2 text-sm font-semibold text-slate-900">
						{item.baseWord}
					</div>
					<div className="flex flex-wrap gap-2">
						{item.forms.map((f) => (
							<span
								key={f.form}
								className="rounded-full bg-blue-50 px-2.5 py-1 text-xs text-blue-700"
							>
								{f.form}{" "}
								<span className="text-blue-400">({f.partOfSpeech})</span>
							</span>
						))}
					</div>
				</>
			)}
		/>
	);
}
