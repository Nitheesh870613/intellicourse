"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, Compass, Crown, Plus, GraduationCap, LogOut, X, Sparkles } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
	{ href: "/dashboard", label: "Home", icon: Home },
	{ href: "/explore", label: "Explore", icon: Compass },
	{ href: "/upgrade", label: "Upgrade", icon: Crown },
];

export default function Sidebar({ isOpen, onClose }) {
	const pathname = usePathname();

	return (
		<>
			{/* Overlay */}
			<AnimatePresence>
				{isOpen && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2 }}
						className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
						onClick={onClose}
					/>
				)}
			</AnimatePresence>

			{/* Sidebar */}
			<motion.aside
				initial={false}
				animate={{ x: isOpen ? 0 : -256 }}
				transition={{ type: "spring", damping: 25, stiffness: 200 }}
				className={cn(
					"fixed left-0 top-0 z-50 h-full w-64 shadow-2xl",
					"bg-white border-r border-gray-200"
				)}
			>
				<div className="flex h-full flex-col">
					{/* Brand */}
					<div className="border-b border-gray-200 p-6 flex items-center justify-between">
						<Link href="/" className="flex items-center space-x-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 shadow-lg">
								<GraduationCap className="h-6 w-6 text-white" />
							</div>
							<h1 className="text-2xl font-bold text-gray-900">
								Intelli<span className="text-purple-600">Course</span>
							</h1>
						</Link>
						{/* Close button */}
						<motion.button
							onClick={onClose}
							className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
							whileHover={{ scale: 1.1, rotate: 90 }}
							whileTap={{ scale: 0.9 }}
						>
							<X className="h-5 w-5 text-gray-600" />
						</motion.button>
					</div>

					{/* Nav */}
					<nav className="flex-1 p-4">
						<ul className="space-y-1">
							{navItems.map(({ href, label, icon: Icon }) => {
								const active = pathname === href || pathname?.startsWith(href + "/");
								return (
									<li key={href}>
										<Link
											href={href}
											className={cn(
												"group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all",
												"hover:bg-purple-50 hover:text-purple-700",
												active
													? "bg-purple-100 text-purple-800 shadow-sm"
													: "text-gray-700"
											)}
										>
											<Icon className="h-5 w-5 transition-transform group-hover:scale-110" />
											<span>{label}</span>
										</Link>
									</li>
								);
							})}
						</ul>
					</nav>

					{/* CTA & User */}
					<div className="border-t border-gray-200 p-4">
						<Link href="/create-course">
							<motion.div
								whileHover={{ scale: 1.05, y: -2 }}
								whileTap={{ scale: 0.98 }}
								className="relative overflow-hidden rounded-xl group cursor-pointer"
							>
								{/* Animated gradient background */}
								<motion.div
									animate={{
										backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
									}}
									transition={{
										duration: 3,
										repeat: Infinity,
										ease: "linear"
									}}
									className="absolute inset-0 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 bg-[length:200%_100%]"
								/>

								{/* Glowing effect */}
								<motion.div
									animate={{
										opacity: [0.5, 1, 0.5],
									}}
									transition={{
										duration: 2,
										repeat: Infinity,
										ease: "easeInOut"
									}}
									className="absolute inset-0 bg-gradient-to-r from-purple-400/50 via-blue-400/50 to-purple-400/50 blur-xl"
								/>

								{/* Shimmer effect */}
								<motion.div
									animate={{
										x: ['-100%', '100%'],
									}}
									transition={{
										duration: 2,
										repeat: Infinity,
										repeatDelay: 1,
										ease: "easeInOut"
									}}
									className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
								/>

								{/* Content */}
								<div className="relative flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-white shadow-2xl">
									<motion.div
										animate={{
											rotate: [0, 360],
										}}
										transition={{
											duration: 2,
											repeat: Infinity,
											ease: "linear"
										}}
									>
										<Sparkles className="h-4 w-4" />
									</motion.div>
									<span className="drop-shadow-lg">Create AI Course</span>
									<motion.div
										animate={{
											scale: [1, 1.2, 1],
										}}
										transition={{
											duration: 1.5,
											repeat: Infinity,
										}}
									>
										<Plus className="h-4 w-4" />
									</motion.div>
								</div>
							</motion.div>
						</Link>
						<div className="mt-4 flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 p-3">
							<UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: "h-8 w-8" } }} />
							<LogOut className="h-4 w-4 text-gray-500" />
						</div>
					</div>
				</div>
			</motion.aside>
		</>
	);
}













