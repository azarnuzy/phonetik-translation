import { Link } from "@tanstack/react-router";
import { BookOpen, Home, ListChecks, User } from "lucide-react";

const navItems = [
	{ to: "/" as const, label: "Home", icon: Home, exact: true },
	{ to: "/material" as const, label: "Material", icon: BookOpen, exact: false },
	{ to: "/quiz" as const, label: "Quiz", icon: ListChecks, exact: false },
	{ to: "/profile" as const, label: "Profile", icon: User, exact: false },
];

export function BottomNav() {
	return (
		<nav className="fixed inset-x-0 bottom-0 z-10 border-t border-slate-200 bg-white">
			<div className="mx-auto flex max-w-md items-stretch justify-between px-2">
				{navItems.map(({ to, label, icon: Icon, exact }) => (
					<Link
						key={to}
						to={to}
						className="flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium text-slate-400"
						activeProps={{
							className:
								"flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium text-blue-600",
						}}
						activeOptions={{ exact }}
					>
						<Icon className="h-5 w-5" />
						{label}
					</Link>
				))}
			</div>
		</nav>
	);
}
