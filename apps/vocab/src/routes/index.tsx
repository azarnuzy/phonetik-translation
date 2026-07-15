import { createFileRoute, Link } from "@tanstack/react-router";
import { Award, Flame, type LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { getMyStats, listDiscourses } from "@/lib/api";
import type { DiscourseSummary, MeStats } from "@/lib/types";

export const Route = createFileRoute("/")({ component: HomePage });

function StatCard({
	icon: Icon,
	label,
	value,
}: {
	icon: LucideIcon;
	label: string;
	value: string;
}) {
	return (
		<div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
			<Icon className="h-5 w-5 text-blue-600" />
			<div>
				<div className="text-sm font-semibold text-slate-900">{value}</div>
				<div className="text-xs text-slate-500">{label}</div>
			</div>
		</div>
	);
}

function HomePage() {
	const [stats, setStats] = useState<MeStats | null>(null);
	const [discourses, setDiscourses] = useState<DiscourseSummary[] | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		Promise.all([getMyStats(), listDiscourses()])
			.then(([s, d]) => {
				setStats(s);
				setDiscourses(d);
			})
			.catch((e) => setError(e.message));
	}, []);

	const inProgress = discourses?.find(
		(d) => !d.comingSoon && d.learnedWords > 0 && d.learnedWords < d.totalWords,
	);
	const continueTarget = inProgress ?? discourses?.find((d) => !d.comingSoon);

	return (
		<PageShell>
			<div className="mb-5 flex items-center gap-3 rounded-2xl bg-blue-600 px-4 py-4 text-white">
				<span className="text-2xl">👋</span>
				<div>
					<div className="text-base font-semibold">English Access</div>
					<div className="text-sm text-blue-100">
						Let's improve your vocabulary!
					</div>
				</div>
			</div>

			<div className="mb-5 flex gap-3">
				<StatCard
					icon={Flame}
					label="Streak"
					value={`${stats?.currentStreak ?? 0} days`}
				/>
				<StatCard
					icon={Award}
					label="Points"
					value={`${stats?.points ?? 0} pts`}
				/>
			</div>

			{error && <p className="text-sm text-red-600">{error}</p>}

			{continueTarget && (
				<div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4">
					<div className="mb-1 text-sm font-semibold text-slate-900">
						Continue Learning
					</div>
					<div className="mb-2 text-sm text-slate-600">
						{continueTarget.title}
					</div>
					<div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
						<div
							className="h-full rounded-full bg-blue-600"
							style={{
								width: `${continueTarget.totalWords === 0 ? 0 : Math.round((continueTarget.learnedWords / continueTarget.totalWords) * 100)}%`,
							}}
						/>
					</div>
					<Link
						to="/material/$slug"
						params={{ slug: continueTarget.slug }}
						className="block w-full rounded-xl bg-blue-600 py-2.5 text-center text-sm font-semibold text-white"
					>
						Continue
					</Link>
				</div>
			)}

			<div className="mb-3 text-sm font-semibold text-slate-900">
				Categories
			</div>
			<div className="space-y-2">
				{discourses?.map((d) => (
					<Link
						key={d.slug}
						to={d.comingSoon ? "/material" : "/material/$slug"}
						params={d.comingSoon ? undefined : { slug: d.slug }}
						className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3"
					>
						<span className="text-sm font-medium text-slate-900">
							{d.title}
						</span>
						<span className="text-xs text-slate-500">
							{d.comingSoon
								? "Coming soon"
								: `${d.learnedWords} / ${d.totalWords} words`}
						</span>
					</Link>
				))}
			</div>
		</PageShell>
	);
}
