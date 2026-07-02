'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, ArrowRight, ArrowLeft, Send, 
  AlertCircle, CheckCircle, Flag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import QuizTimer from './QuizTimer';
import QuizResults from './QuizResults';
import QuizReview from './QuizReview';

export default function EnhancedModuleQuiz({ 
  module, 
  courseId, 
  onComplete,
  enableTimer = false,
  timerDuration = 600
}) {
  const [quizState, setQuizState] = useState('idle'); // idle, active, results, review
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [startTime, setStartTime] = useState(null);
  const [timeSpent, setTimeSpent] = useState(0);
  const [attemptData, setAttemptData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset when module changes
  useEffect(() => {
    setQuizState('idle');
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setStartTime(null);
    setTimeSpent(0);
  }, [module]);

  if (!module.quiz || module.quiz.length === 0) {
    return null;
  }

  const currentQuestion = module.quiz[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / module.quiz.length) * 100;
  const answeredCount = Object.keys(userAnswers).length;

  const handleStart = () => {
    setQuizState('active');
    setStartTime(Date.now());
  };

  const handleAnswer = (answer) => {
    setUserAnswers({
      ...userAnswers,
      [currentQuestionIndex]: answer
    });
  };

  const handleNext = () => {
    if (currentQuestionIndex < module.quiz.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleTimeUp = () => {
    toast.warning('Time is up! Submitting your quiz...');
    setTimeout(() => handleSubmit(), 1000);
  };

  const handleSubmit = async () => {
    // Calculate score
    let correctCount = 0;
    let wrongCount = 0;
    const skippedCount = module.quiz.length - answeredCount;
    
    const detailedAnswers = module.quiz.map((question, index) => {
      const userAnswer = userAnswers[index];
      const correctAnswer = question.correctAnswer !== undefined 
        ? question.correctAnswer 
        : question.correct_answer;
      const isCorrect = userAnswer === correctAnswer;
      
      if (userAnswer !== undefined) {
        if (isCorrect) correctCount++;
        else wrongCount++;
      }

      return {
        questionId: `q${index}`,
        question: question.question,
        userAnswer,
        correctAnswer,
        isCorrect,
        options: question.options
      };
    });

    const score = Math.round((correctCount / module.quiz.length) * 100);
    const elapsed = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
    setTimeSpent(elapsed);

    // Save to API
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          moduleId: module.id || `module-${module.title}`,
          moduleIndex: module.index || 0,
          answers: detailedAnswers,
          score,
          totalQuestions: module.quiz.length,
          correctAnswers: correctCount,
          wrongAnswers: wrongCount,
          skippedAnswers: skippedCount,
          timeSpent: elapsed
        })
      });

      if (response.ok) {
        const data = await response.json();
        setAttemptData(data);
        toast.success('Quiz submitted successfully!');
      } else {
        toast.error('Failed to save quiz results');
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast.error('Error submitting quiz');
    } finally {
      setIsSubmitting(false);
    }

    setQuizState('results');
  };

  const handleRetake = () => {
    setUserAnswers({});
    setCurrentQuestionIndex(0);
    setQuizState('active');
    setStartTime(Date.now());
  };

  const handleReview = () => {
    setQuizState('review');
  };

  const handleBackToResults = () => {
    setQuizState('results');
  };

  const handleContinue = () => {
    onComplete?.();
  };

  // Idle State - Start Screen
  if (quizState === 'idle') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-purple-500/20 via-blue-500/20 to-pink-500/20 backdrop-blur-xl rounded-2xl p-8 border border-white/20"
      >
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="p-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500">
              <Brain className="w-12 h-12 text-white" />
            </div>
          </div>
          
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Ready to Test Your Knowledge?
            </h2>
            <p className="text-white/70">
              This quiz has {module.quiz.length} questions
              {enableTimer && ` and a ${Math.floor(timerDuration / 60)} minute time limit`}.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-white/70">Questions</span>
              <span className="font-semibold text-white">{module.quiz.length}</span>
            </div>
            {enableTimer && (
              <div className="flex items-center justify-between">
                <span className="text-white/70">Time Limit</span>
                <span className="font-semibold text-white">
                  {Math.floor(timerDuration / 60)} minutes
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-white/70">Passing Score</span>
              <span className="font-semibold text-white">70%</span>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <Button
              onClick={handleStart}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              size="lg"
            >
              <Brain className="w-5 h-5 mr-2" />
              Start Quiz
            </Button>
            <Button
              onClick={onComplete}
              variant="outline"
              className="bg-white/5 border-white/20 text-white hover:bg-white/10"
              size="lg"
            >
              Skip for Now
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  // Results State
  if (quizState === 'results') {
    const correctCount = Object.values(userAnswers).filter((answer, index) => {
      const correctAnswer = module.quiz[index].correctAnswer !== undefined 
        ? module.quiz[index].correctAnswer 
        : module.quiz[index].correct_answer;
      return answer === correctAnswer;
    }).length;

    return (
      <QuizResults
        score={Math.round((correctCount / module.quiz.length) * 100)}
        totalQuestions={module.quiz.length}
        correctAnswers={correctCount}
        wrongAnswers={module.quiz.length - correctCount}
        timeSpent={timeSpent}
        onRetake={handleRetake}
        onContinue={handleContinue}
        onReview={handleReview}
        attemptNumber={attemptData?.attemptNumber || 1}
        bestScore={attemptData?.bestScore || 0}
      />
    );
  }

  // Review State
  if (quizState === 'review') {
    return (
      <QuizReview
        questions={module.quiz}
        userAnswers={userAnswers}
        onBack={handleBackToResults}
      />
    );
  }

  // Active State - Quiz Questions
  return (
    <div className="space-y-6">
      {/* Timer (if enabled) */}
      {enableTimer && (
        <QuizTimer
          duration={timerDuration}
          onTimeUp={handleTimeUp}
          enabled={quizState === 'active'}
        />
      )}

      {/* Progress Bar */}
      <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-white/70">
            Question {currentQuestionIndex + 1} of {module.quiz.length}
          </span>
          <span className="text-sm text-white/70">
            {answeredCount} / {module.quiz.length} answered
          </span>
        </div>
        <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestionIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10"
        >
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div className="text-sm text-white/60">
                Question {currentQuestionIndex + 1}
              </div>
            </div>
            <h3 className="text-2xl font-semibold text-white">
              {currentQuestion.question}
            </h3>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {currentQuestion.options?.map((option, index) => {
              const isSelected = userAnswers[currentQuestionIndex] === index;
              
              return (
                <motion.button
                  key={index}
                  onClick={() => handleAnswer(index)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'border-purple-500 bg-purple-500/20 shadow-lg shadow-purple-500/20'
                      : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                      isSelected
                        ? 'bg-purple-500 text-white'
                        : 'bg-white/10 text-white/60'
                    }`}>
                      {String.fromCharCode(65 + index)}
                    </div>
                    <div className={`flex-1 ${
                      isSelected ? 'text-white font-medium' : 'text-white/80'
                    }`}>
                      {option}
                    </div>
                    {isSelected && (
                      <CheckCircle className="w-5 h-5 text-purple-400" />
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Warning if not answered */}
          {userAnswers[currentQuestionIndex] === undefined && currentQuestionIndex > 0 && (
            <div className="mt-4 flex items-center gap-2 text-yellow-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>This question is not answered yet</span>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-4">
        <Button
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
          variant="outline"
          className="bg-white/5 border-white/20 text-white hover:bg-white/10 disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>

        <div className="flex gap-2">
          {module.quiz.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentQuestionIndex(index)}
              className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${
                index === currentQuestionIndex
                  ? 'bg-purple-500 text-white'
                  : userAnswers[index] !== undefined
                  ? 'bg-green-500/30 text-green-400 border border-green-500/50'
                  : 'bg-white/10 text-white/60 border border-white/20'
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>

        {currentQuestionIndex === module.quiz.length - 1 ? (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
          >
            {isSubmitting ? (
              <>Submitting...</>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Submit Quiz
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            Next
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>

      {/* Submit Early Button */}
      {answeredCount === module.quiz.length && currentQuestionIndex < module.quiz.length - 1 && (
        <div className="text-center">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            variant="outline"
            className="bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20"
          >
            <Flag className="w-4 h-4 mr-2" />
            Submit Now (All questions answered)
          </Button>
        </div>
      )}
    </div>
  );
}
