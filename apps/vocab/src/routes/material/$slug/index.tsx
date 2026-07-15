import { createFileRoute, Link } from "@tanstack/react-router";
import {
	BookOpen,
	ChevronRight,
	Layers,
	ListChecks,
	Repeat,
	Shuffle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { PageHeader, PageShell, ProgressBar } from "@/components/PageShell";
import { getDiscourse } from "@/lib/api";
import type { DiscourseDetail } from "@/lib/types";

export const Route = createFileRoute("/material/$slug/")({
	component: DiscoursePage,
});

const topics = [
	{
		to: "/material/$slug/vocabulary" as const,
		label: "Topic Vocabulary",
		icon: BookOpen,
		total: (d: DiscourseDetail) => d.sections.topicVocabulary.total,
	},
	{
		to: "/material/$slug/phrasal-verbs" as const,
		label: "Phrasal Verbs",
		icon: Shuffle,
		total: (d: DiscourseDetail) => d.sections.phrasalVerbs.total,
	},
	{
		to: "/material/$slug/word-formation" as const,
		label: "Word Formation",
		icon: Layers,
		total: (d: DiscourseDetail) => d.sections.wordFormation.total,
	},
	{
		to: "/material/$slug/word-patterns" as const,
		label: "Word Patterns",
		icon: Repeat,
		total: (d: DiscourseDetail) => d.sections.wordPatterns.total,
	},
	{
		to: "/material/$slug/prepositional-phrases" as const,
		label: "Prepositional Phrases",
		icon: BookOpen,
		total: (d: DiscourseDetail) => d.sections.prepositionalPhrases.total,
	},
	{
		to: "/material/$slug/quiz" as const,
		label: "Review & Practice",
		icon: ListChecks,
		total: (d: DiscourseDetail) => d.sections.quiz.total,
	},
];

function DiscoursePage() {
	const { slug } = Route.useParams();
	const [discourse, setDiscourse] = useState<DiscourseDetail | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		getDiscourse(slug)
			.then(setDiscourse)
			.catch((e) => setError(e.message));
	}, [slug]);

	if (error) {
		return (
			<PageShell>
				<PageHeader title="Discourse" backTo="/material" />
				<p className="text-sm text-red-600">{error}</p>
			</PageShell>
		);
	}

	if (!discourse) {
		return (
			<PageShell>
				<PageHeader title="Discourse" backTo="/material" />
			</PageShell>
		);
	}

	const { topicVocabulary } = discourse.sections;

	return (
		<PageShell>
			<PageHeader title={discourse.title} backTo="/material" />

			<div className="mb-6 rounded-xl border border-slate-200 bg-white p-4">
				<div className="mb-1 flex items-center justify-between text-xs text-slate-500">
					<span>Progress</span>
					<span>
						{topicVocabulary.learned} / {topicVocabulary.total} words
					</span>
				</div>
				<ProgressBar
					value={topicVocabulary.learned}
					max={topicVocabulary.total}
				/>
			</div>

			<p className="mb-3 text-sm font-semibold text-slate-900">
				Topics in this discourse:
			</p>
			<div className="space-y-2">
				{topics.map(({ to, label, icon: Icon, total }) => (
					<Link
						key={to}
						to={to}
						params={{ slug }}
						className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3"
					>
						<Icon className="h-5 w-5 text-blue-600" />
						<span className="flex-1 text-sm font-medium text-slate-900">
							{label}
						</span>
						<span className="text-xs text-slate-400">{total(discourse)}</span>
						<ChevronRight className="h-4 w-4 text-slate-300" />
					</Link>
				))}
			</div>

			<Link
				to="/material/$slug/vocabulary"
				params={{ slug }}
				className="mt-6 block w-full rounded-xl bg-blue-600 py-2.5 text-center text-sm font-semibold text-white"
			>
				Start Learning
			</Link>
		</PageShell>
	);
}
