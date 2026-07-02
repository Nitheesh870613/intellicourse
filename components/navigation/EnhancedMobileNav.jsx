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
  BookOpen,
  X
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/explore', label: 'Explore', icon: Compass },
  { href: '/upgrade', label: 'Upgrade', icon: Crown },
];

export default function EnhancedMobileNav() {
  const [showFAB, setShowFAB] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Main Bottom Navigation */}
      <nav className="fixed bottom-4 left-1/2 z-50 w-[92%] max-w-md -translate-x-1/2 md:hidden">
        <div className="relative">
          {/* Main Nav Bar */}
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            className="rounded-2xl border border-white/20 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl shadow-2xl dark:border-white/10 p-2"
          >
            <ul className="grid grid-cols-4 gap-1">
              {navItems.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || pathname?.startsWith(href + '/');
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className={cn(
                        'flex flex-col items-center gap-1 rounded-xl px-3 py-2.5 text-xs font-medium transition-all',
                        active
                          ? 'bg-purple-100 text-purple-700 dark:bg-violet-900/40 dark:text-violet-200'
                          : 'text-neutral-600 dark:text-neutral-300 active:scale-95'
                      )}
                    >
                      <Icon className={cn('h-5 w-5', active && 'scale-110')} />
                      <span className="truncate w-full text-center">{label}</span>
                    </Link>
                  </li>
                );
              })}

              {/* FAB Trigger */}
              <li>
                <button
                  onClick={() => setShowFAB(!showFAB)}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-xl px-3 py-2.5 text-xs font-medium transition-all w-full',
                    showFAB
                      ? 'bg-purple-600 text-white'
                      : 'bg-gradient-to-br from-purple-600 to-violet-600 text-white'
                  )}
                >
                  {showFAB ? (
                    <X className="h-5 w-5" />
                  ) : (
                    <Plus className="h-5 w-5" />
                  )}
                  <span>{showFAB ? 'Close' : 'Create'}</span>
                </button>
              </li>
            </ul>
          </motion.div>

          {/* FAB Menu */}
          <AnimatePresence>
            {showFAB && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.9 }}
                transition={{ type: 'spring', damping: 25 }}
                className="absolute bottom-full right-0 mb-4 w-64 rounded-2xl border border-white/20 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl shadow-2xl dark:border-white/10 p-3"
              >
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 px-3 py-1">
                    Quick Actions
                  </div>

                  <Link
                    href="/create-course"
                    onClick={() => setShowFAB(false)}
                    className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 text-white hover:from-purple-700 hover:to-violet-700 transition-all active:scale-95"
                  >
                    <div className="p-2 rounded-lg bg-white/20">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">Create Course</div>
                      <div className="text-xs text-white/80">Generate AI course</div>
                    </div>
                  </Link>

                  <Link
                    href="/dashboard"
                    onClick={() => setShowFAB(false)}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/50 dark:bg-neutral-800/50 hover:bg-white dark:hover:bg-neutral-800 transition-all active:scale-95"
                  >
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                      <Home className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-neutral-900 dark:text-white">
                        My Courses
                      </div>
                      <div className="text-xs text-neutral-600 dark:text-neutral-400">
                        View all courses
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/explore"
                    onClick={() => setShowFAB(false)}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/50 dark:bg-neutral-800/50 hover:bg-white dark:hover:bg-neutral-800 transition-all active:scale-95"
                  >
                    <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                      <Compass className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-neutral-900 dark:text-white">
                        Explore Topics
                      </div>
                      <div className="text-xs text-neutral-600 dark:text-neutral-400">
                        Browse categories
                      </div>
                    </div>
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      {/* Overlay when FAB is open */}
      <AnimatePresence>
        {showFAB && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowFAB(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>
    </>
  );
}
