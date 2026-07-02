'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Brain, Trophy, RefreshCw, Loader2, Lightbulb } from 'lucide-react';
import { useParams } from 'next/navigation';

/**
 * Module Quiz Component with API Integration
 * 
 * After quiz submission, the system enters review mode where correct answers,
 * user selections, and explanations are rendered based on stored quiz attempts,
 * ensuring transparency and effective learning reinforcement.
 */
export default function ModuleQuiz({ module, moduleIndex = 0, onComplete }) {
  const { id: courseId } = useParams();

  const [quizStarted, setQuizStarted] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [reviewData, setReviewData] = useState(null);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Module ID for API
  const moduleId = module?.id || `module-${moduleIndex}`;

  // Reset quiz state when module changes
  useEffect(() => {
    // Reset all quiz state for new module
    setQuizStarted(true);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setSubmitted(false);
    setReviewData(null);
    setScore(0);
    setTotal(0);
    setIsLoading(true);
  }, [moduleIndex, module?.id]);

  // Fetch previous attempt on mount or when module changes
  useEffect(() => {
    async function fetchPreviousAttempt() {
      if (!courseId || !moduleId) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch(
          `/api/quiz/submit?courseId=${courseId}&moduleId=${moduleId}`
        );

        if (res.ok) {
          const data = await res.json();

          if (data.success && data.reviewData && data.reviewData.answers) {
            // Restore review state from previous attempt
            setReviewData(data.reviewData.answers);
            setScore(data.reviewData.score);
            setTotal(data.reviewData.total);
            setSubmitted(true);

            // Restore selected answers
            const restoredAnswers = {};
            data.reviewData.answers.forEach((answer, index) => {
              restoredAnswers[index] = answer.selected;
            });
            setSelectedAnswers(restoredAnswers);
          }
        }
      } catch (error) {
        console.error('Error fetching previous attempt:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPreviousAttempt();
  }, [courseId, moduleId]);

  // Reset quiz state when module changes (for retake)
  const resetQuiz = () => {
    setQuizStarted(true);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setSubmitted(false);
    setReviewData(null);
    setScore(0);
    setTotal(0);
  };

  if (!module?.quiz || module.quiz.length === 0) {
    return null;
  }

  const handleAnswer = (questionIndex, answer) => {
    if (submitted) return; // Lock after submit

    setSelectedAnswers({
      ...selectedAnswers,
      [questionIndex]: answer
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

  /**
   * Submit Quiz to API - Returns review data with correct answers
   */
  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          moduleId,
          moduleIndex,
          answers: selectedAnswers,
          questions: module.quiz
        })
      });

      const data = await res.json();

      if (data.success) {
        setReviewData(data.answers);
        setScore(data.score);
        setTotal(data.total);
        setSubmitted(true);

        console.log(`Module quiz submitted:`, {
          score: data.percentage,
          correct: data.score,
          total: data.total
        });
      } else {
        console.error('Quiz submit failed:', data.error);
        // Fallback to local calculation if API fails
        let correctCount = 0;
        module.quiz.forEach((question, index) => {
          if (selectedAnswers[index] === question.correct_answer) {
            correctCount++;
          }
        });
        setScore(correctCount);
        setTotal(module.quiz.length);
        setSubmitted(true);
      }
    } catch (err) {
      console.error('Error submitting quiz:', err);
      // Fallback to local calculation
      let correctCount = 0;
      module.quiz.forEach((question, index) => {
        if (selectedAnswers[index] === question.correct_answer) {
          correctCount++;
        }
      });
      setScore(correctCount);
      setTotal(module.quiz.length);
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetake = () => {
    resetQuiz();
  };

  const currentQuestion = module.quiz[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / module.quiz.length) * 100;
  const scorePercentage = total > 0 ? Math.round((score / total) * 100) : 0;

  // Card styles matching spec
  const cardStyle = {
    background: '#1C1E27',
    border: '1px solid rgba(255,255,255,0.05)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
    borderRadius: '16px',
    padding: '24px'
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="mt-6" style={cardStyle}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
          <span className="ml-3 text-gray-400">Loading quiz...</span>
        </div>
      </div>
    );
  }

  // Start Quiz Screen
  if (!quizStarted && !submitted) {
    return (
      <div className="mt-6" style={cardStyle}>
        <div className="flex items-center gap-3 mb-6">
          <Brain className="w-6 h-6 text-[#9B6BFF]" />
          <h3 style={{ fontSize: '20px', fontWeight: 600 }} className="text-white">
            Test Your Knowledge
          </h3>
        </div>
        <div className="text-center space-y-4">
          <p className="text-gray-300" style={{ fontSize: '16px' }}>
            Ready to test what you learned? This quiz has {module.quiz.length} questions.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setQuizStarted(true)}
              className="px-6 py-3 rounded-lg font-medium text-white transition-colors hover:opacity-90"
              style={{ background: '#9B6BFF' }}
            >
              <Brain className="w-4 h-4 mr-2 inline" />
              Start Quiz
            </button>
            <button
              onClick={onComplete}
              className="px-6 py-3 rounded-lg font-medium transition-colors hover:bg-white/5"
              style={{ border: '1px solid rgba(255,255,255,0.2)', color: 'rgb(209,213,219)' }}
            >
              Skip Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Quiz Results Screen with Review Mode
  if (submitted) {
    return (
      <div className="mt-6" style={cardStyle}>
        {/* Score Header */}
        <div className="flex items-center gap-3 mb-6">
          <Trophy className="w-6 h-6 text-yellow-400" />
          <h3 style={{ fontSize: '20px', fontWeight: 600 }} className="text-white">
            Quiz Complete!
          </h3>
        </div>

        <div className="space-y-6">
          {/* Score Summary */}
          <div className="text-center space-y-4 p-6 rounded-xl"
            style={{
              background: scorePercentage >= 70 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
              border: scorePercentage >= 70 ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(239,68,68,0.3)'
            }}
          >
            <div className={`text-6xl font-bold ${scorePercentage >= 70 ? 'text-green-400' : 'text-red-400'}`}>
              {scorePercentage}%
            </div>
            <p className="text-xl text-gray-300">
              {score} out of {total || module.quiz.length} correct
            </p>
            <p className="text-gray-400">
              {scorePercentage >= 80 ? '🎉 Excellent work!' :
                scorePercentage >= 60 ? '👍 Good job!' :
                  '💪 Keep learning!'}
            </p>
          </div>

          {/* Review Answers - MANDATORY per spec */}
          <div className="space-y-4 max-h-[500px] overflow-y-auto">
            {(reviewData || module.quiz.map((q, i) => ({
              question: q.question,
              selected: selectedAnswers[i],
              correct: q.correct_answer,
              isCorrect: selectedAnswers[i] === q.correct_answer,
              explanation: q.explanation,
              options: q.options
            }))).map((review, index) => {
              const question = module.quiz[index];
              const isCorrect = review.isCorrect;

              return (
                <div
                  key={index}
                  className="p-4 rounded-xl"
                  style={{
                    background: isCorrect ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                    border: isCorrect ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(239,68,68,0.3)'
                  }}
                >
                  {/* Question Header */}
                  <div className="flex items-start gap-2 mb-4">
                    {isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400 mt-1 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="text-white font-medium" style={{ fontSize: '16px' }}>
                        {index + 1}. {review.question || question?.question}
                      </p>
                    </div>
                  </div>

                  {/* Options with highlighting per spec */}
                  <div className="space-y-2 mb-4 ml-7">
                    {(review.options || question?.options || []).map((option, optionIndex) => {
                      const correctAnswer = review.correct || question?.correct_answer;
                      const selectedAnswer = review.selected || selectedAnswers[index];

                      const isCorrectOption = option === correctAnswer;
                      const isSelectedWrong = option === selectedAnswer && !isCorrect;

                      // OPTION STYLES (MANDATORY per spec)
                      let className = "p-3 rounded-xl border ";

                      if (isCorrectOption) {
                        // Correct answer = Green border
                        className += "border-green-500 bg-green-500/10";
                      } else if (isSelectedWrong) {
                        // Wrong selected = Red border  
                        className += "border-red-500 bg-red-500/10";
                      } else {
                        // Not selected = Neutral
                        className += "border-white/10 bg-white/5";
                      }

                      return (
                        <div key={optionIndex} className={className}>
                          <div className="flex items-center gap-3">
                            <span className={`${isCorrectOption ? 'text-green-400' :
                              isSelectedWrong ? 'text-red-400' : 'text-gray-400'
                              }`}>
                              {option}
                            </span>
                            {isCorrectOption && (
                              <CheckCircle2 className="w-4 h-4 text-green-400 ml-auto" />
                            )}
                            {isSelectedWrong && (
                              <XCircle className="w-4 h-4 text-red-400 ml-auto" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Answer Summary */}
                  <div className="ml-7 text-sm space-y-1 mb-3">
                    <p className={isCorrect ? 'text-green-400' : 'text-red-400'}>
                      <strong>Your answer:</strong> {review.selected || selectedAnswers[index] || 'Not answered'}
                    </p>
                    {!isCorrect && (
                      <p className="text-green-400">
                        <strong>Correct answer:</strong> {review.correct || question?.correct_answer}
                      </p>
                    )}
                  </div>

                  {/* Explanation Display (IMPORTANT per spec) */}
                  {(review.explanation || question?.explanation) && (
                    <div className="ml-7 mt-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                      <div className="flex items-start gap-2">
                        <Lightbulb className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-blue-300">
                          💡 {review.explanation || question?.explanation}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-center pt-4">
            <button
              onClick={handleRetake}
              className="px-6 py-3 rounded-lg font-medium transition-colors hover:bg-white/5"
              style={{ border: '1px solid rgba(255,255,255,0.2)', color: 'rgb(209,213,219)' }}
            >
              <RefreshCw className="w-4 h-4 mr-2 inline" />
              Retake Quiz
            </button>
            <button
              onClick={onComplete}
              className="px-6 py-3 rounded-lg font-medium text-white transition-colors hover:opacity-90"
              style={{ background: '#9B6BFF' }}
            >
              Continue to Next Module
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Quiz Question Screen
  return (
    <div className="mt-6" style={cardStyle}>
      {/* Header */}
      <div className="space-y-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="w-6 h-6 text-[#9B6BFF]" />
            <h3 style={{ fontSize: '20px', fontWeight: 600 }} className="text-white">
              Module Quiz
            </h3>
          </div>
          <span className="text-sm text-gray-400">
            Question {currentQuestionIndex + 1} of {module.quiz.length}
          </span>
        </div>

        {/* Progress bar */}
        <div
          className="w-full rounded-full overflow-hidden"
          style={{ height: '6px', background: 'rgba(255,255,255,0.05)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${progress}%`, background: '#9B6BFF' }}
          />
        </div>
      </div>

      {/* Question Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestionIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="space-y-4"
        >
          <p className="text-white font-medium" style={{ fontSize: '18px' }}>
            {currentQuestion.question}
          </p>

          {/* Options - Store actual option string, not index */}
          <div className="space-y-3">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = selectedAnswers[currentQuestionIndex] === option;

              return (
                <button
                  key={idx}
                  onClick={() => handleAnswer(currentQuestionIndex, option)}
                  disabled={submitted}
                  className="w-full text-left p-4 rounded-xl transition-all duration-200"
                  style={{
                    background: isSelected ? 'rgba(155,107,255,0.2)' : 'rgba(255,255,255,0.03)',
                    border: isSelected ? '1px solid #9B6BFF' : '1px solid rgba(255,255,255,0.04)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected && !submitted) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected && !submitted) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                    }
                  }}
                >
                  <span className="font-medium text-gray-300" style={{ fontSize: '16px' }}>
                    {option}
                  </span>
                </button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6 mt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <button
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
          className="px-6 py-3 rounded-lg font-medium transition-colors hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ border: '1px solid rgba(255,255,255,0.2)', color: 'rgb(209,213,219)' }}
        >
          Previous
        </button>

        <div className="flex gap-2">
          {currentQuestionIndex < module.quiz.length - 1 ? (
            <button
              onClick={handleNext}
              disabled={!selectedAnswers[currentQuestionIndex]}
              className="px-6 py-3 rounded-lg font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
              style={{ background: '#9B6BFF' }}
            >
              Next Question
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-3 rounded-lg font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
              style={{ background: '#22C55E' }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                  Submitting...
                </>
              ) : (
                'Submit Quiz'
              )}
            </button>
          )}
        </div>
      </div>

      {/* Mark as Done button */}
      <div className="pt-4 mt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <button
          onClick={onComplete}
          className="w-full px-6 py-3 rounded-lg font-medium transition-colors hover:bg-white/5 flex items-center justify-center gap-2"
          style={{ border: '1px solid rgba(255,255,255,0.2)', color: 'rgb(209,213,219)' }}
        >
          <CheckCircle2 className="w-4 h-4" />
          Mark as Done & Continue
        </button>
      </div>
    </div>
  );
}
