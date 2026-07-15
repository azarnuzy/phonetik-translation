import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { PageHeader, PageShell, ProgressBar } from "@/components/PageShell";
import { listDiscourses } from "@/lib/api";
import type { DiscourseSummary } from "@/lib/types";

export const Route = createFileRoute("/material/")({ component: MaterialPage });

function MaterialPage() {
	const [discourses, setDiscourses] = useState<DiscourseSummary[] | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		listDiscourses()
			.then(setDiscourses)
			.catch((e) => setError(e.message));
	}, []);

	return (
		<PageShell>
			<PageHeader title="Select Discourse" />
			<p className="mb-4 text-sm text-slate-500">
				Choose a discourse to get started
			</p>

			{error && <p className="text-sm text-red-600">{error}</p>}

			<div className="space-y-3">
				{discourses?.map((d) =>
					d.comingSoon ? (
						<div
							key={d.slug}
							className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 opacity-60"
						>
							<span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-200 text-slate-400">
								<Lock className="h-5 w-5" />
							</span>
							<div className="min-w-0 flex-1">
								<div className="text-sm font-semibold text-slate-700">
									{d.title}
								</div>
								<div className="text-xs text-slate-500">Coming soon</div>
							</div>
						</div>
					) : (
						<Link
							key={d.slug}
							to="/material/$slug"
							params={{ slug: d.slug }}
							className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3"
						>
							<span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
								<BookOpen className="h-5 w-5" />
							</span>
							<div className="min-w-0 flex-1">
								<div className="text-sm font-semibold text-slate-900">
									{d.title}
								</div>
								<div className="mb-1 text-xs text-slate-500">
									{d.learnedWords} / {d.totalWords} words
								</div>
								<ProgressBar value={d.learnedWords} max={d.totalWords} />
							</div>
						</Link>
					),
				)}
			</div>
		</PageShell>
	);
}
