'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Lock } from 'lucide-react';

export function ProgressIndicator({ progress, totalModules }) {
  const percentage = totalModules > 0 ? Math.round((progress / totalModules) * 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-white/70">Progress</span>
        <span className="text-white font-semibold">{percentage}%</span>
      </div>
      <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
      <div className="text-xs text-white/60">
        {progress} of {totalModules} modules completed
      </div>
    </div>
  );
}

export function ModuleProgressList({ modules, progress }) {
  return (
    <div className="space-y-3">
      {modules.map((module, index) => {
        const moduleProgress = progress?.find(p => p.moduleIndex === index);
        const isCompleted = moduleProgress?.isCompleted || false;
        const isInProgress = moduleProgress && !isCompleted;
        const isLocked = index > 0 && !progress?.find(p => p.moduleIndex === index - 1)?.isCompleted;

        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
              isCompleted
                ? 'bg-green-500/10 border border-green-500/30'
                : isInProgress
                ? 'bg-blue-500/10 border border-blue-500/30'
                : isLocked
                ? 'bg-white/5 border border-white/10 opacity-50'
                : 'bg-white/5 border border-white/10'
            }`}
          >
            <div className="flex-shrink-0">
              {isCompleted ? (
                <CheckCircle2 className="w-6 h-6 text-green-400" />
              ) : isLocked ? (
                <Lock className="w-6 h-6 text-white/30" />
              ) : (
                <Circle className="w-6 h-6 text-white/30" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">
                {module.title}
              </div>
              {moduleProgress && (
                <div className="flex items-center gap-2 mt-1 text-xs text-white/60">
                  {moduleProgress.quizScore !== null && (
                    <span className="text-purple-400">
                      Quiz: {moduleProgress.quizScore}%
                    </span>
                  )}
                  {moduleProgress.timeSpent > 0 && (
                    <span>
                      {Math.round(moduleProgress.timeSpent / 60)} min
                    </span>
                  )}
                </div>
              )}
            </div>
            {isCompleted && moduleProgress?.bestQuizScore > 0 && (
              <div className="flex-shrink-0">
                <div className="text-xs font-semibold text-green-400">
                  {moduleProgress.bestQuizScore}%
                </div>
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

export function CircularProgress({ percentage, size = 120, strokeWidth = 8 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-white/10"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#gradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-white">{percentage}%</div>
          <div className="text-xs text-white/60">Complete</div>
        </div>
      </div>
    </div>
  );
}
