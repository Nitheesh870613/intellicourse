'use client';

import { motion } from 'framer-motion';
import {
  BookOpen,
  CheckCircle,
  Clock,
  TrendingUp,
  Award,
  Target,
  Flame,
  Trophy
} from 'lucide-react';

export default function StatsOverview({ analytics }) {
  if (!analytics?.overview) {
    return null;
  }

  const { overview } = analytics;

  const stats = [
    {
      label: 'Total Courses',
      value: overview.totalCourses || 0,
      icon: BookOpen,
      borderColor: 'border-gray-200',
      change: '+2 this month'
    },
    {
      label: 'Completed',
      value: overview.completedCourses || 0,
      icon: CheckCircle,
      borderColor: 'border-gray-200',
      change: `${overview.averageCompletionRate || 0}% rate`
    },
    {
      label: 'In Progress',
      value: overview.inProgressCourses || 0,
      icon: TrendingUp,
      borderColor: 'border-gray-200',
      change: 'Keep going!'
    },
    {
      label: 'Modules Done',
      value: overview.totalModulesCompleted || 0,
      icon: Target,
      borderColor: 'border-gray-200',
      change: 'Great progress'
    },
    {
      label: 'Avg Quiz Score',
      value: `${overview.averageQuizScore || 0}%`,
      icon: Award,
      borderColor: 'border-gray-200',
      change: overview.averageQuizScore >= 80 ? 'Excellent!' : 'Keep improving'
    },
    {
      label: 'Time Invested',
      value: formatTime(overview.totalTimeSpent || 0),
      icon: Clock,
      borderColor: 'border-white/10',
      change: 'Hours learned'
    }
  ];

  return (
    <div className="mt-8 rounded-xl bg-[#070818] border border-white/5 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">
          Your Learning Stats
        </h2>
        <p className="text-sm text-white/60">
          Track your progress and achievements
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02, y: -4 }}
              className="relative overflow-hidden rounded-xl border border-white/10 bg-[#0F172A] p-5 hover:border-white/30 transition-transform cursor-pointer group"
            >
              {/* Icon */}
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 group-hover:scale-105 transition-transform">
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>

              {/* Value */}
              <div className="space-y-1 mb-3">
                <div className="text-3xl font-semibold text-white">
                  {stat.value}
                </div>
                <div className="text-sm font-medium text-white/60">
                  {stat.label}
                </div>
              </div>

              {/* Change indicator */}
              <div className="flex items-center gap-1.5 text-xs font-medium text-white/60">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{stat.change}</span>
              </div>

              {/* Hover effect line (subtle neutral underline) */}
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/15 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
            </motion.div>
          );
        })}
      </div>

      {/* Achievements Preview */}
      {overview.averageQuizScore >= 90 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-6 rounded-xl bg-[#0F172A] border border-white/10"
        >
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-full bg-white/5 border border-white/15">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white mb-1">
                🎉 Top Performer!
              </h3>
              <p className="text-sm text-white/70">
                You've maintained an average quiz score of {overview.averageQuizScore}%! Keep up the excellent work!
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Streak Badge (if applicable) */}
      {overview.totalModulesCompleted >= 10 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-6 rounded-xl bg-[#0F172A] border border-white/10"
        >
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-full bg-white/5 border border-white/15">
              <Flame className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white mb-1">
                🔥 On Fire!
              </h3>
              <p className="text-sm text-white/70">
                {overview.totalModulesCompleted} modules completed! You're on a learning streak!
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function formatTime(seconds) {
  if (!seconds) return '0h';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}
