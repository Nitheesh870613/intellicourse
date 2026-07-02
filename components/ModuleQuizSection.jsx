'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  CheckCircle,
  XCircle,
  RotateCcw,
  Trophy,
  Play,
  Loader2,
  Lightbulb
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

/**
 * Module Quiz Section Component
 * 
 * After quiz submission, the system enters review mode where correct answers,
 * user selections, and explanations are rendered based on stored quiz attempts,
 * ensuring transparency and effective learning reinforcement.
 */
export default function ModuleQuizSection({
  courseId,
  moduleId,
  moduleIndex,
  moduleTitle,
  quizData = [],
  onScoreUpdate
}) {
  // Quiz state
  const [isStarted, setIsStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [reviewData, setReviewData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Results state
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);

  // If no quiz data, don't render anything
  if (!quizData || quizData.length === 0) {
    return null;
  }

  const totalQuestions = quizData.length;
  const currentQuestion = quizData[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;
  const allQuestionsAnswered = quizData.every((_, index) =>
    selectedAnswers[index] !== undefined && selectedAnswers[index] !== null
  );

  // Check for previous attempts on mount
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

          if (data.success && data.reviewData) {
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

  const startQuiz = () => {
    setIsStarted(true);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setSubmitted(false);
    setReviewData(null);
  };

  const handleAnswerSelect = (questionIndex, selectedOption) => {
    if (submitted) return; // Lock after submit

    setSelectedAnswers(prev => ({
      ...prev,
      [questionIndex]: selectedOption
    }));
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  /**
   * Submit Quiz to API
   * Returns review data with correct answers per spec
   */
  const submitQuiz = async () => {
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
          questions: quizData
        })
      });

      const data = await res.json();

      if (data.success) {
        setReviewData(data.answers);
        setScore(data.score);
        setTotal(data.total);
        setSubmitted(true);

        // Notify parent component
        if (onScoreUpdate) {
          onScoreUpdate(data.percentage, data.score, data.total);
        }

        console.log(`Module ${moduleTitle} quiz submitted:`, {
          score: data.percentage,
          correct: data.score,
          total: data.total
        });
      } else {
        console.error('Quiz submit failed:', data.error);
      }
    } catch (err) {
      console.error('Error submitting quiz:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const retakeQuiz = () => {
    setIsStarted(false);
    setSubmitted(false);
    setReviewData(null);
    setSelectedAnswers({});
    setCurrentQuestionIndex(0);
    setScore(0);
    setTotal(0);
  };

  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

  const getScoreColor = (pct) => {
    if (pct >= 80) return 'text-green-400';
    if (pct >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreMessage = (pct) => {
    if (pct >= 90) return 'Excellent! You have mastered this module! 🎉';
    if (pct >= 80) return 'Great job! You understand the concepts well! 👏';
    if (pct >= 70) return 'Good work! You grasp most of the material! 👍';
    if (pct >= 60) return 'Not bad! Review the content and try again! 📚';
    return 'Keep studying! Review this module carefully! 💪';
  };

  // Loading state
  if (isLoading) {
    return (
      <Card className="border border-white/10 bg-[#1c1c29]">
        <CardContent className="py-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-400" />
          <p className="text-white/60 mt-2">Loading quiz...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Quiz Header */}
      <Card className="border border-purple-500/30 bg-[#1c1c29]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center border border-purple-500/30">
                <Brain className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-lg text-white">
                  Module Quiz
                </CardTitle>
                <p className="text-white/60 text-sm">
                  Test your understanding of {moduleTitle}
                </p>
              </div>
            </div>
            <div className="text-sm text-purple-400 font-medium">
              {totalQuestions} Questions
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Quiz Content */}
      <AnimatePresence mode="wait">
        {/* Start Screen */}
        {!isStarted && !submitted && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="border border-white/10 bg-[#1c1c29]">
              <CardContent className="py-8 text-center space-y-4">
                <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto border border-purple-500/30">
                  <Play className="w-8 h-8 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Ready to Test Your Knowledge?</h3>
                  <p className="text-white/60 max-w-md mx-auto">
                    This quiz contains {totalQuestions} questions about {moduleTitle}.
                    Test your understanding of the key concepts covered in this module.
                  </p>
                </div>
                <Button onClick={startQuiz} size="lg" className="bg-purple-600 hover:bg-purple-700">
                  Start Quiz
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Quiz Questions */}
        {isStarted && !submitted && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            {/* Progress */}
            <Card className="border border-white/10 bg-[#1c1c29]">
              <CardContent className="py-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white">
                    Question {currentQuestionIndex + 1} of {totalQuestions}
                  </span>
                  <span className="text-sm text-white/60">{Math.round(progress)}% Complete</span>
                </div>
                <Progress value={progress} className="h-2" />
              </CardContent>
            </Card>

            {/* Current Question */}
            <Card className="border border-white/10 bg-[#1c1c29]">
              <CardContent className="py-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">
                      {currentQuestion.question}
                    </h3>
                  </div>

                  <div className="space-y-3">
                    {currentQuestion.options.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => handleAnswerSelect(currentQuestionIndex, option)}
                        className={`w-full flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all text-left ${selectedAnswers[currentQuestionIndex] === option
                            ? 'border-purple-500 bg-purple-500/20'
                            : 'border-white/10 bg-white/5 hover:border-purple-500/50 hover:bg-white/10'
                          }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold mr-4 ${selectedAnswers[currentQuestionIndex] === option
                            ? 'bg-purple-500 text-white'
                            : 'bg-white/10 text-white/60'
                          }`}>
                          {String.fromCharCode(65 + index)}
                        </div>
                        <span className="text-white">{option}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Navigation */}
            <Card className="border border-white/10 bg-[#1c1c29]">
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <Button
                    onClick={previousQuestion}
                    disabled={currentQuestionIndex === 0}
                    variant="outline"
                    className="bg-white/5 border-white/20 text-white hover:bg-white/10"
                  >
                    Previous
                  </Button>

                  <div className="flex gap-2">
                    {currentQuestionIndex < totalQuestions - 1 ? (
                      <Button
                        onClick={nextQuestion}
                        disabled={!selectedAnswers[currentQuestionIndex]}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        Next Question
                      </Button>
                    ) : (
                      <Button
                        onClick={submitQuiz}
                        disabled={!allQuestionsAnswered || isSubmitting}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            Submitting...
                          </>
                        ) : (
                          'Submit Quiz'
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Review Mode - After Submit */}
        {submitted && reviewData && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-4"
          >
            {/* Score Summary */}
            <Card className={`border-2 ${percentage >= 80
                ? 'border-green-500/50 bg-green-500/10'
                : percentage >= 60
                  ? 'border-yellow-500/50 bg-yellow-500/10'
                  : 'border-red-500/50 bg-red-500/10'
              }`}>
              <CardContent className="py-6 text-center">
                <div className="space-y-4">
                  <div className={`w-16 h-16 ${percentage >= 80 ? 'bg-green-500/20' :
                      percentage >= 60 ? 'bg-yellow-500/20' : 'bg-red-500/20'
                    } rounded-full flex items-center justify-center mx-auto`}>
                    <Trophy className={`w-8 h-8 ${getScoreColor(percentage)}`} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">Quiz Complete!</h3>
                    <p className="text-white/70">{getScoreMessage(percentage)}</p>
                  </div>
                  <div className="flex items-center justify-center gap-6 text-lg">
                    <div className="text-center">
                      <div className={`text-3xl font-bold ${getScoreColor(percentage)}`}>{percentage}%</div>
                      <div className="text-sm text-white/60">Score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-white">{score}/{total}</div>
                      <div className="text-sm text-white/60">Correct</div>
                    </div>
                  </div>
                  <Button onClick={retakeQuiz} variant="outline" className="bg-white/5 border-white/20 text-white hover:bg-white/10">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Retake Quiz
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Review Answers - MANDATORY per spec */}
            <Card className="border border-white/10 bg-[#1c1c29]">
              <CardHeader>
                <CardTitle className="text-lg text-white">Review Answers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {reviewData.map((review, index) => {
                  const question = quizData[index];

                  return (
                    <div
                      key={index}
                      className={`border rounded-xl p-4 ${review.isCorrect
                          ? 'border-green-500/30 bg-green-500/5'
                          : 'border-red-500/30 bg-red-500/5'
                        }`}
                    >
                      {/* Question Header */}
                      <div className="flex items-start gap-3 mb-4">
                        {review.isCorrect ? (
                          <CheckCircle className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-400 mt-1 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <div className="text-sm text-white/60 mb-1">Question {index + 1}</div>
                          <h4 className="font-medium text-white">
                            {review.question || question?.question}
                          </h4>
                        </div>
                      </div>

                      {/* Options with highlighting per spec */}
                      <div className="space-y-2 mb-4">
                        {(review.options || question?.options || []).map((option, optionIndex) => {
                          const isCorrectOption = option === review.correct;
                          const isSelectedWrong = option === review.selected && !review.isCorrect;

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
                            className += "border-white/10";
                          }

                          return (
                            <div key={optionIndex} className={className}>
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${isCorrectOption
                                    ? 'bg-green-500 text-white'
                                    : isSelectedWrong
                                      ? 'bg-red-500 text-white'
                                      : 'bg-white/10 text-white/60'
                                  }`}>
                                  {String.fromCharCode(65 + optionIndex)}
                                </div>
                                <div className={`flex-1 ${isCorrectOption || isSelectedWrong
                                    ? 'text-white font-medium'
                                    : 'text-white/70'
                                  }`}>
                                  {option}
                                </div>
                                {isCorrectOption && (
                                  <CheckCircle className="w-5 h-5 text-green-400" />
                                )}
                                {isSelectedWrong && (
                                  <XCircle className="w-5 h-5 text-red-400" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Answer Summary */}
                      <div className="text-sm space-y-1 mb-3">
                        <div className={review.isCorrect ? 'text-green-400' : 'text-red-400'}>
                          <strong>Your answer:</strong> {review.selected || 'Not answered'}
                        </div>
                        {!review.isCorrect && (
                          <div className="text-green-400">
                            <strong>Correct answer:</strong> {review.correct}
                          </div>
                        )}
                      </div>

                      {/* Explanation Display (IMPORTANT per spec) */}
                      {review.explanation && (
                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mt-3">
                          <div className="flex items-start gap-3">
                            <Lightbulb className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <div className="text-sm font-semibold text-blue-400 mb-1">
                                Explanation
                              </div>
                              <p className="text-sm text-white/80">
                                💡 {review.explanation}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
