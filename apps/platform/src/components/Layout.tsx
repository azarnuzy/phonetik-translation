import { Link } from "@tanstack/react-router";
import { AudioWaveform, Heart, History, Home } from "lucide-react";
import type { ReactNode } from "react";

const navItems = [
	{ to: "/" as const, label: "Beranda", icon: Home, exact: true },
	{ to: "/riwayat" as const, label: "Riwayat", icon: History, exact: false },
	{ to: "/favorit" as const, label: "Favorit", icon: Heart, exact: false },
];

export function Layout({ children }: { children: ReactNode }) {
	return (
		<div className="min-h-screen bg-slate-50">
			<header className="border-b border-slate-200 bg-white">
				<div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-3 py-3 sm:px-4">
					<Link to="/" className="flex min-w-0 items-center gap-2">
						<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white">
							<AudioWaveform className="h-5 w-5" />
						</span>
						<span className="min-w-0">
							<span className="block truncate text-base font-semibold leading-tight text-slate-900">
								Phonetik
							</span>
							<span className="hidden truncate text-xs leading-tight text-slate-500 sm:block">
								From Text to Phonetic
							</span>
						</span>
					</Link>

					<nav className="flex shrink-0 items-center gap-0.5 sm:gap-1">
						{navItems.map(({ to, label, icon: Icon, exact }) => (
							<Link
								key={to}
								to={to}
								className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 sm:px-3"
								activeProps={{
									className:
										"flex items-center gap-1.5 rounded-lg bg-violet-100 px-2.5 py-2 text-sm font-medium text-violet-700 sm:px-3",
								}}
								activeOptions={{ exact }}
							>
								<Icon className="h-4 w-4" />
								<span className="hidden sm:inline">{label}</span>
							</Link>
						))}
					</nav>
				</div>
			</header>

			<main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
		</div>
	);
}
