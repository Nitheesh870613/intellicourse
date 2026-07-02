'use client';

import { motion } from 'framer-motion';
import Confetti from 'react-confetti';
import { useWindowSize } from '@/hooks/useWindowSize';
import {
  Trophy,
  Target,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CircularProgress } from '../ProgressIndicator';

export default function QuizResults({
  score,
  totalQuestions,
  correctAnswers,
  wrongAnswers,
  timeSpent,
  onRetake,
  onContinue,
  onReview,
  attemptNumber = 1,
  bestScore = 0
}) {
  const { width, height } = useWindowSize();
  const percentage = Math.round((correctAnswers / totalQuestions) * 100);
  const isPassed = percentage >= 70;
  const isNewBest = percentage > bestScore;

  // Get performance message
  const getPerformanceMessage = () => {
    if (percentage >= 90) return { title: '🎉 Outstanding!', message: 'You\'re a master!', color: 'text-green-400' };
    if (percentage >= 80) return { title: '🌟 Excellent!', message: 'Great job!', color: 'text-blue-400' };
    if (percentage >= 70) return { title: '✅ Good Work!', message: 'You passed!', color: 'text-purple-400' };
    if (percentage >= 50) return { title: '📚 Keep Learning!', message: 'Almost there!', color: 'text-yellow-400' };
    return { title: '💪 Try Again!', message: 'Practice makes perfect!', color: 'text-orange-400' };
  };

  const performance = getPerformanceMessage();

  const stats = [
    {
      label: 'Score',
      value: `${percentage}%`,
      icon: Target,
      color: 'from-purple-500 to-blue-500'
    },
    {
      label: 'Correct',
      value: correctAnswers,
      icon: CheckCircle2,
      color: 'from-green-500 to-emerald-500'
    },
    {
      label: 'Wrong',
      value: wrongAnswers,
      icon: XCircle,
      color: 'from-red-500 to-orange-500'
    },
    {
      label: 'Time',
      value: formatTime(timeSpent),
      icon: Clock,
      color: 'from-indigo-500 to-purple-500'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-6"
    >
      {/* Confetti for high scores */}
      {isPassed && percentage >= 80 && (
        <Confetti
          width={width}
          height={height}
          recycle={false}
          numberOfPieces={200}
          gravity={0.3}
        />
      )}

      {/* Main Result Card */}
      <div className="bg-gradient-to-br from-purple-500/20 via-blue-500/20 to-pink-500/20 backdrop-blur-xl rounded-2xl p-8 border border-white/20">
        <div className="text-center space-y-6">
          {/* Trophy Icon */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', duration: 0.8, delay: 0.2 }}
            className="flex justify-center"
          >
            <div className={`p-6 rounded-full bg-gradient-to-br ${
              isPassed ? 'from-green-400 to-emerald-500' : 'from-orange-400 to-red-500'
            }`}>
              <Trophy className="w-16 h-16 text-white" />
            </div>
          </motion.div>

          {/* Title */}
          <div>
            <h2 className={`text-4xl font-bold ${performance.color} mb-2`}>
              {performance.title}
            </h2>
            <p className="text-xl text-white/80">{performance.message}</p>
            {isNewBest && attemptNumber > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 flex items-center justify-center gap-2 text-yellow-400"
              >
                <TrendingUp className="w-5 h-5" />
                <span className="font-semibold">New Best Score!</span>
              </motion.div>
            )}
          </div>

          {/* Circular Progress */}
          <div className="flex justify-center">
            <CircularProgress percentage={percentage} size={160} />
          </div>

          {/* Attempt Info */}
          {attemptNumber > 1 && (
            <div className="text-sm text-white/60">
              Attempt #{attemptNumber} • Best: {bestScore}%
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10"
            >
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-sm text-white/60">{stat.label}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <Button
          onClick={onReview}
          variant="outline"
          className="flex-1 bg-white/5 border-white/20 text-white hover:bg-white/10"
        >
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Review Answers
        </Button>
        
        {!isPassed && (
          <Button
            onClick={onRetake}
            className="flex-1 bg-gradient-to-r from-orange-400 to-red-400 hover:from-orange-500 hover:to-red-500"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retake Quiz
          </Button>
        )}
        
        <Button
          onClick={onContinue}
          className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          Continue Learning
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </motion.div>

      {/* Pass/Fail Message */}
      <div className={`text-center p-4 rounded-xl border ${
        isPassed
          ? 'bg-green-500/10 border-green-500/30 text-green-400'
          : 'bg-orange-500/10 border-orange-500/30 text-orange-400'
      }`}>
        <p className="font-medium">
          {isPassed
            ? '✅ Quiz Passed! You can proceed to the next module.'
            : '❌ Quiz not passed. Score 70% or higher to proceed.'}
        </p>
      </div>
    </motion.div>
  );
}

function formatTime(seconds) {
  if (!seconds) return '0s';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}
