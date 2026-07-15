import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

export function PageShell({ children }: { children: ReactNode }) {
	return (
		<div className="min-h-screen bg-slate-50">
			<main className="mx-auto max-w-md px-4 pb-24 pt-6">{children}</main>
			<BottomNav />
		</div>
	);
}

export function PageHeader({
	title,
	backTo,
}: {
	title: string;
	backTo?: string;
}) {
	return (
		<div className="mb-5 flex items-center gap-2">
			{backTo && (
				<Link
					to={backTo}
					className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
				>
					<ChevronLeft className="h-5 w-5" />
				</Link>
			)}
			<h1 className="text-lg font-semibold text-slate-900">{title}</h1>
		</div>
	);
}

export function ProgressBar({ value, max }: { value: number; max: number }) {
	const pct = max === 0 ? 0 : Math.min(100, Math.round((value / max) * 100));
	return (
		<div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
			<div
				className="h-full rounded-full bg-blue-600 transition-all"
				style={{ width: `${pct}%` }}
			/>
		</div>
	);
}
