'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Home,
  Compass,
  Crown,
  Plus,
  GraduationCap,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { UserButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';

const navItems = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/explore', label: 'Explore', icon: Compass },
  { href: '/upgrade', label: 'Upgrade', icon: Crown },
];

export default function CollapsibleSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();

  const toggleCollapse = () => setIsCollapsed(!isCollapsed);
  const toggleMobile = () => setIsMobileOpen(!isMobileOpen);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={toggleMobile}
        className="fixed top-4 left-4 z-50 md:hidden p-3 rounded-xl bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl border border-white/20 shadow-lg"
      >
        {isMobileOpen ? (
          <X className="w-5 h-5 text-neutral-900 dark:text-white" />
        ) : (
          <Menu className="w-5 h-5 text-neutral-900 dark:text-white" />
        )}
      </button>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleMobile}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: isCollapsed ? '80px' : '256px',
          x: isMobileOpen ? 0 : '-100%'
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={cn(
          "fixed left-0 top-0 z-40 h-full border-r border-white/20 bg-white/70 backdrop-blur-xl shadow-xl dark:bg-neutral-900/60 dark:border-white/10",
          "md:translate-x-0"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Brand */}
          <div className="border-b border-white/20 p-6 dark:border-white/10 relative">
            <Link
              href="/"
              className="flex items-center space-x-3"
              onClick={() => setIsMobileOpen(false)}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 shadow-md flex-shrink-0">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.h1
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-2xl font-bold text-transparent whitespace-nowrap overflow-hidden"
                  >
                    IntelliCourse
                  </motion.h1>
                )}
              </AnimatePresence>
            </Link>

            {/* Desktop Collapse Button */}
            <button
              onClick={toggleCollapse}
              className="absolute -right-3 top-8 hidden md:flex items-center justify-center w-6 h-6 rounded-full bg-purple-600 text-white shadow-lg hover:bg-purple-700 transition-colors"
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <ul className="space-y-1">
              {navItems.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || pathname?.startsWith(href + '/');
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={() => setIsMobileOpen(false)}
                      className={cn(
                        'group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all',
                        'hover:bg-purple-50 hover:text-purple-700 dark:hover:bg-violet-950/40 dark:hover:text-violet-300',
                        active
                          ? 'bg-purple-100 text-purple-800 shadow-sm dark:bg-violet-900/40 dark:text-violet-100'
                          : 'text-neutral-700 dark:text-neutral-300',
                        isCollapsed && 'justify-center'
                      )}
                      title={isCollapsed ? label : ''}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-110" />
                      <AnimatePresence>
                        {!isCollapsed && (
                          <motion.span
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                            className="whitespace-nowrap overflow-hidden"
                          >
                            {label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* CTA & User */}
          <div className="border-t border-white/20 p-4 dark:border-white/10">
            <Link href="/create-course" onClick={() => setIsMobileOpen(false)}>
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="relative overflow-hidden rounded-xl cursor-pointer group"
                title={isCollapsed ? 'Create AI Course' : ''}
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
                <div className={cn(
                  "relative flex items-center gap-2 px-4 py-3 text-sm font-bold text-white shadow-2xl",
                  isCollapsed ? 'justify-center' : 'justify-center'
                )}>
                  <motion.div
                    animate={{
                      rotate: [0, 360],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                    className="flex-shrink-0"
                  >
                    <Sparkles className="h-4 w-4" />
                  </motion.div>
                  <AnimatePresence>
                    {!isCollapsed && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        className="whitespace-nowrap overflow-hidden drop-shadow-lg"
                      >
                        Create AI Course
                      </motion.span>
                    )}
                  </AnimatePresence>
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                    }}
                    className="flex-shrink-0"
                  >
                    <Plus className="h-4 w-4" />
                  </motion.div>
                </div>
              </motion.div>
            </Link>

            <div className={cn(
              "mt-4 flex items-center rounded-xl border border-white/20 bg-white/50 p-3 dark:bg-neutral-900/60",
              isCollapsed ? 'justify-center' : 'justify-between'
            )}>
              <UserButton
                afterSignOutUrl="/"
                appearance={{ elements: { avatarBox: 'h-8 w-8' } }}
              />
              {!isCollapsed && (
                <LogOut className="h-4 w-4 text-neutral-500" />
              )}
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Spacer for content */}
      <div className={cn(
        "hidden md:block transition-all duration-300",
        isCollapsed ? "w-20" : "w-64"
      )} />
    </>
  );
}
