import { createFileRoute } from "@tanstack/react-router";
import { useCallback } from "react";
import { CardListPage } from "@/components/CardListPage";
import { listPhrasalVerbs } from "@/lib/api";
import type { PhrasalVerb } from "@/lib/types";

export const Route = createFileRoute("/material/$slug/phrasal-verbs")({
	component: PhrasalVerbsPage,
});

function PhrasalVerbsPage() {
	const { slug } = Route.useParams();
	const load = useCallback(() => listPhrasalVerbs(slug), [slug]);

	return (
		<CardListPage<PhrasalVerb>
			title="Phrasal Verbs"
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
