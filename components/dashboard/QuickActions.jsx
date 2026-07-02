'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Plus,
  BookOpen,
  Compass,
  TrendingUp,
  FileText,
  Sparkles
} from 'lucide-react';

export default function QuickActions() {
  const actions = [
    {
      title: 'Create Course',
      description: 'Generate AI-powered course',
      icon: Plus,
      href: '/create-course',
      gradient: 'from-purple-500 to-violet-600',
      bgGradient: 'from-purple-500/10 to-violet-600/10',
      borderColor: 'border-purple-500/30'
    },
    {
      title: 'My Courses',
      description: 'View all your courses',
      icon: BookOpen,
      href: '/dashboard#courses',
      gradient: 'from-blue-500 to-cyan-600',
      bgGradient: 'from-blue-500/10 to-cyan-600/10',
      borderColor: 'border-blue-500/30'
    },
    {
      title: 'Explore',
      description: 'Browse topics & categories',
      icon: Compass,
      href: '/explore',
      gradient: 'from-green-500 to-emerald-600',
      bgGradient: 'from-green-500/10 to-emerald-600/10',
      borderColor: 'border-green-500/30'
    },
    {
      title: 'Analytics',
      description: 'Track your progress',
      icon: TrendingUp,
      href: '/dashboard#analytics',
      gradient: 'from-orange-500 to-red-400',
      bgGradient: 'from-orange-500/10 to-red-400/10',
      borderColor: 'border-orange-500/30'
    },
    {
      title: 'My Notes',
      description: 'Review saved notes',
      icon: FileText,
      href: '/dashboard#notes',
      gradient: 'from-pink-500 to-rose-600',
      bgGradient: 'from-pink-500/10 to-rose-600/10',
      borderColor: 'border-pink-500/30'
    },
    {
      title: 'Upgrade',
      description: 'Get premium features',
      icon: Sparkles,
      href: '/upgrade',
      gradient: 'from-yellow-500 to-amber-600',
      bgGradient: 'from-yellow-500/10 to-amber-600/10',
      borderColor: 'border-yellow-500/30'
    }
  ];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
          Quick Actions
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400">
          Jump to your most common tasks
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <motion.div
              key={action.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                href={action.href}
                className={`group block p-5 rounded-2xl border bg-gradient-to-br backdrop-blur-xl ${action.bgGradient} ${action.borderColor} hover:shadow-lg transition-all hover:scale-105 active:scale-95`}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-md`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-neutral-900 dark:text-white mb-1">
                    {action.title}
                  </div>
                  <div className="text-xs text-neutral-600 dark:text-neutral-400">
                    {action.description}
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
