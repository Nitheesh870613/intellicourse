"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MobileNav() {
	const pathname = usePathname();
	return (
		<nav className="fixed bottom-4 left-1/2 z-50 w-[92%] -translate-x-1/2 rounded-2xl border border-white/20 bg-white/80 p-2 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-neutral-900/70 md:hidden">
			<ul className="grid grid-cols-3">
				{[
					{ href: "/dashboard", label: "Home", icon: Home },
					{ href: "/explore", label: "Explore", icon: Compass },
					{ href: "/upgrade", label: "Upgrade", icon: Crown },
				].map(({ href, label, icon: Icon }) => {
					const active = pathname === href || pathname?.startsWith(href + "/");
					return (
						<li key={href}>
							<Link href={href} className={cn("flex flex-col items-center gap-1 rounded-xl px-3 py-2 text-xs font-medium", active ? "text-purple-700 dark:text-violet-200" : "text-neutral-600 dark:text-neutral-300")}> 
								<Icon className={cn("h-5 w-5", active && "scale-110")} />
								<span>{label}</span>
							</Link>
						</li>
					);
				})}
			</ul>
		</nav>
	);
}













