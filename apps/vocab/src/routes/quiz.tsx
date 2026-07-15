import { createFileRoute, Link } from "@tanstack/react-router";
import { Lock, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { PageHeader, PageShell } from "@/components/PageShell";
import { listDiscourses } from "@/lib/api";
import type { DiscourseSummary } from "@/lib/types";

export const Route = createFileRoute("/quiz")({ component: QuizTabPage });

function QuizTabPage() {
	const [discourses, setDiscourses] = useState<DiscourseSummary[] | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		listDiscourses()
			.then(setDiscourses)
			.catch((e) => setError(e.message));
	}, []);

	return (
		<PageShell>
			<PageHeader title="Review & Practice" />
			<p className="mb-4 text-sm text-slate-500">
				Let's review what you've learned!
			</p>

			{error && <p className="text-sm text-red-600">{error}</p>}

			<div className="space-y-3">
				{discourses?.map((d) =>
					d.comingSoon ? (
						<div
							key={d.slug}
							className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 opacity-60"
						>
							<Lock className="h-5 w-5 text-slate-400" />
							<div className="text-sm font-semibold text-slate-700">
								{d.title}
							</div>
						</div>
					) : (
						<Link
							key={d.slug}
							to="/material/$slug/quiz"
							params={{ slug: d.slug }}
							className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3"
						>
							<Trophy className="h-5 w-5 text-amber-400" />
							<div className="flex-1 text-sm font-semibold text-slate-900">
								{d.title}
							</div>
							<span className="text-xs font-medium text-blue-600">
								Start Quiz
							</span>
						</Link>
					),
				)}
			</div>
		</PageShell>
	);
}
