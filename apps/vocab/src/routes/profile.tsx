import { createFileRoute, Link } from "@tanstack/react-router";
import { Award, Flame, Star, User } from "lucide-react";
import { useEffect, useState } from "react";
import { PageHeader, PageShell } from "@/components/PageShell";
import { getMyStats } from "@/lib/api";
import type { MeStats } from "@/lib/types";

export const Route = createFileRoute("/profile")({ component: ProfilePage });

function ProfilePage() {
	const [stats, setStats] = useState<MeStats | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		getMyStats()
			.then(setStats)
			.catch((e) => setError(e.message));
	}, []);

	return (
		<PageShell>
			<PageHeader title="Profile" />

			<div className="mb-6 flex flex-col items-center rounded-2xl border border-slate-200 bg-white py-8">
				<span className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600">
					<User className="h-8 w-8" />
				</span>
				<div className="text-sm font-semibold text-slate-900">
					Anonymous learner
				</div>
				<div className="text-xs text-slate-500">
					Signed in silently, no account needed
				</div>
			</div>

			{error && <p className="text-sm text-red-600">{error}</p>}

			<div className="mb-6 grid grid-cols-3 gap-3">
				<div className="rounded-xl border border-slate-200 bg-white py-4 text-center">
					<Flame className="mx-auto mb-1 h-5 w-5 text-orange-500" />
					<div className="text-sm font-bold text-slate-900">
						{stats?.currentStreak ?? 0}
					</div>
					<div className="text-xs text-slate-500">Streak</div>
				</div>
				<div className="rounded-xl border border-slate-200 bg-white py-4 text-center">
					<Award className="mx-auto mb-1 h-5 w-5 text-blue-600" />
					<div className="text-sm font-bold text-slate-900">
						{stats?.points ?? 0}
					</div>
					<div className="text-xs text-slate-500">Points</div>
				</div>
				<div className="rounded-xl border border-slate-200 bg-white py-4 text-center">
					<Star className="mx-auto mb-1 h-5 w-5 text-amber-400" />
					<div className="text-sm font-bold text-slate-900">
						{stats?.learnedWords ?? 0}
					</div>
					<div className="text-xs text-slate-500">Learned</div>
				</div>
			</div>

			<Link
				to="/my-words"
				className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3"
			>
				<span className="text-sm font-medium text-slate-900">My Words</span>
				<span className="text-xs text-slate-500">
					{stats?.savedWords ?? 0} saved
				</span>
			</Link>
		</PageShell>
	);
}
