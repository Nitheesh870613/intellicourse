'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Clock, Target, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CircularProgress } from '../ProgressIndicator';

export default function ResumeCard({ course, analytics }) {
  if (!course || !analytics) {
    return null;
  }

  const progressPercentage = analytics.progressPercentage || 0;
  const lastModule = analytics.lastAccessedModuleIndex || 0;
  const totalModules = analytics.totalModules || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-purple-500/20 via-blue-500/20 to-pink-500/20 backdrop-blur-xl rounded-2xl p-8 border border-white/20 shadow-2xl"
    >
      <div className="flex items-start gap-3 mb-6">
        <div className="p-3 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600">
          <BookOpen className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-white/70 mb-1">
            Continue Learning
          </h3>
          <h2 className="text-2xl font-bold text-white mb-2">
            {course.title || course.course_title}
          </h2>
          {course.description && (
            <p className="text-white/70 text-sm line-clamp-2">
              {course.description}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Progress Circle */}
        <div className="flex items-center justify-center">
          <CircularProgress percentage={progressPercentage} size={140} />
        </div>

        {/* Stats */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
            <div className="p-2 rounded-lg bg-blue-500/30">
              <Target className="w-5 h-5 text-blue-300" />
            </div>
            <div className="flex-1">
              <div className="text-white/60 text-xs">Progress</div>
              <div className="text-white font-semibold">
                Module {lastModule + 1} of {totalModules}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
            <div className="p-2 rounded-lg bg-green-500/30">
              <Clock className="w-5 h-5 text-green-300" />
            </div>
            <div className="flex-1">
              <div className="text-white/60 text-xs">Last Accessed</div>
              <div className="text-white font-semibold">
                {analytics.lastAccessedAt
                  ? new Date(analytics.lastAccessedAt).toLocaleDateString()
                  : 'Recently'}
              </div>
            </div>
          </div>

          {analytics.averageQuizScore > 0 && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
              <div className="p-2 rounded-lg bg-purple-500/30">
                <Target className="w-5 h-5 text-purple-300" />
              </div>
              <div className="flex-1">
                <div className="text-white/60 text-xs">Avg Quiz Score</div>
                <div className="text-white font-semibold">
                  {analytics.averageQuizScore}%
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Button */}
      <Link href={`/course/${course.id}`}>
        <Button
          size="lg"
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all"
        >
          <span>Continue Learning</span>
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </Link>

      {/* Additional Info */}
      <div className="mt-4 flex items-center justify-center gap-2 text-sm text-white/50">
        <span>{analytics.modulesCompleted} modules completed</span>
        <span>•</span>
        <span>{totalModules - analytics.modulesCompleted} remaining</span>
      </div>
    </motion.div>
  );
}
