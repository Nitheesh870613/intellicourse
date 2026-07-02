'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  CheckCircle, 
  XCircle, 
  RotateCcw, 
  Trophy, 
  Clock,
  Target,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

/**
 * QuizSection Component
 * 
 * Interactive quiz component that:
 * 1. Fetches quiz questions for a chapter
 * 2. Displays questions with multiple choice options
 * 3. Tracks user answers and calculates scores
 * 4. Shows results with explanations
 * 5. Allows retaking the quiz
 * 6. Saves progress to user_progress table
 */
export default function QuizSection({ chapterId, onScoreUpdate }) {
  // Quiz state
  const [quizData, setQuizData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Quiz interaction state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [timeStarted, setTimeStarted] = useState(null);
  const [timeCompleted, setTimeCompleted] = useState(null);
  
  // Results state
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch quiz questions on component mount
  useEffect(() => {
    if (chapterId) {
      fetchQuizQuestions();
    }
  }, [chapterId]);

  const fetchQuizQuestions = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('Fetching quiz for chapter:', chapterId);
      const response = await fetch(`/api/generate-quiz?chapterId=${chapterId}`);
      const data = await response.json();

      console.log('Fetch quiz response:', { status: response.status, data });

      if (!response.ok) {
        console.error('Fetch quiz failed:', data);
        throw new Error(data.error || 'Failed to fetch quiz');
      }

      if (data.questions && data.questions.length > 0) {
        console.log('Quiz questions found:', data.questions.length);
        setQuizData(data);
      } else {
        console.log('No quiz questions found, generating new quiz...');
        // Generate quiz if it doesn't exist
        await generateQuiz();
      }
    } catch (err) {
      console.error('Error in fetchQuizQuestions:', err);
      setError(`Failed to load quiz: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const generateQuiz = async () => {
    try {
      setIsLoading(true);
      console.log('Generating quiz for chapter:', chapterId);
      
      const response = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterId }),
      });

      const data = await response.json();
      console.log('Generate quiz response:', { status: response.status, data });

      if (!response.ok) {
        console.error('Generate quiz failed:', data);
        throw new Error(data.error || 'Failed to generate quiz');
      }

      console.log('Quiz generation successful, fetching questions...');
      // Fetch the generated quiz
      await fetchQuizQuestions();
    } catch (err) {
      setError(err.message);
      console.error('Error generating quiz:', err);
    }
  };

  const startQuiz = () => {
    setQuizStarted(true);
    setTimeStarted(Date.now());
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setShowResults(false);
  };

  const handleAnswerSelect = (questionId, selectedOption) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: selectedOption
    }));
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < quizData.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const submitQuiz = async () => {
    setIsSubmitting(true);
    setTimeCompleted(Date.now());

    try {
      // Calculate score
      let correct = 0;
      quizData.questions.forEach(question => {
        if (userAnswers[question.id] === question.correctAnswer) {
          correct++;
        }
      });

      const totalQuestions = quizData.questions.length;
      const scorePercentage = Math.round((correct / totalQuestions) * 100);

      setCorrectAnswers(correct);
      setScore(scorePercentage);
      setShowResults(true);

      // Save progress to database
      await saveQuizProgress(scorePercentage, totalQuestions, correct);

      // Notify parent component of score update
      if (onScoreUpdate) {
        onScoreUpdate(scorePercentage, correct, totalQuestions);
      }

    } catch (err) {
      console.error('Error submitting quiz:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveQuizProgress = async (scorePercentage, totalQuestions, correctAnswers) => {
    try {
      const response = await fetch('/api/save-quiz-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterId,
          quizScore: scorePercentage,
          totalQuestions,
          correctAnswers,
          timeSpent: timeCompleted - timeStarted
        }),
      });

      if (!response.ok) {
        console.warn('Failed to save quiz progress');
      }
    } catch (err) {
      console.warn('Error saving quiz progress:', err);
    }
  };

  const retakeQuiz = () => {
    setQuizStarted(false);
    setShowResults(false);
    setUserAnswers({});
    setCurrentQuestionIndex(0);
    setScore(0);
    setCorrectAnswers(0);
    setTimeStarted(null);
    setTimeCompleted(null);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreMessage = (score) => {
    if (score >= 90) return 'Excellent! You have mastered this topic! 🎉';
    if (score >= 80) return 'Great job! You have a solid understanding! 👏';
    if (score >= 70) return 'Good work! You understand most concepts! 👍';
    if (score >= 60) return 'Not bad! Consider reviewing the material! 📚';
    return 'Keep studying! Review the chapter and try again! 💪';
  };

  // Loading state
  if (isLoading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
            <p className="text-gray-600">Loading quiz questions...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="w-full max-w-4xl mx-auto border-red-200">
        <CardContent className="py-8">
          <div className="text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
            <h3 className="text-lg font-semibold text-red-800">Quiz Unavailable</h3>
            <p className="text-red-600">{error}</p>
            <Button onClick={fetchQuizQuestions} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No quiz data
  if (!quizData || !quizData.questions || quizData.questions.length === 0) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="py-8">
          <div className="text-center space-y-4">
            <Brain className="w-12 h-12 text-gray-400 mx-auto" />
            <h3 className="text-lg font-semibold text-gray-800">No Quiz Available</h3>
            <p className="text-gray-600">Quiz questions are not available for this chapter yet.</p>
            <Button onClick={generateQuiz} className="bg-blue-600 hover:bg-blue-700">
              Generate Quiz
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentQuestion = quizData.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quizData.questions.length) * 100;
  const allQuestionsAnswered = quizData.questions.every(q => userAnswers[q.id]);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Quiz Header */}
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl text-blue-900">
                  Chapter Quiz: {quizData.chapterTitle}
                </CardTitle>
                <p className="text-blue-700 text-sm">
                  Test your understanding with {quizData.questions.length} questions
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <Target className="w-4 h-4" />
              <span>{quizData.difficulty || 'Beginner'}</span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Quiz Content */}
      <AnimatePresence mode="wait">
        {!quizStarted && !showResults && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card>
              <CardContent className="py-12 text-center space-y-6">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <Brain className="w-10 h-10 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Ready to Test Your Knowledge?</h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    This quiz contains {quizData.questions.length} multiple-choice questions based on the chapter content.
                    Take your time and choose the best answer for each question.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>No time limit</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <RotateCcw className="w-4 h-4" />
                    <span>Retake anytime</span>
                  </div>
                </div>
                <Button onClick={startQuiz} size="lg" className="bg-blue-600 hover:bg-blue-700">
                  Start Quiz
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {quizStarted && !showResults && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Progress Bar */}
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Question {currentQuestionIndex + 1} of {quizData.questions.length}
                  </span>
                  <span className="text-sm text-gray-500">{Math.round(progress)}% Complete</span>
                </div>
                <Progress value={progress} className="h-2" />
              </CardContent>
            </Card>

            {/* Current Question */}
            <Card>
              <CardContent className="py-8">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">
                      {currentQuestion.question}
                    </h3>
                  </div>

                  <div className="space-y-3">
                    {currentQuestion.options.map((option, index) => (
                      <label
                        key={index}
                        className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${
                          userAnswers[currentQuestion.id] === option
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`question-${currentQuestion.id}`}
                          value={option}
                          checked={userAnswers[currentQuestion.id] === option}
                          onChange={() => handleAnswerSelect(currentQuestion.id, option)}
                          className="w-4 h-4 text-blue-600 mr-4"
                        />
                        <span className="text-gray-800">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Navigation */}
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <Button
                    onClick={previousQuestion}
                    disabled={currentQuestionIndex === 0}
                    variant="outline"
                  >
                    Previous
                  </Button>

                  <div className="flex gap-2">
                    {currentQuestionIndex < quizData.questions.length - 1 ? (
                      <Button
                        onClick={nextQuestion}
                        disabled={!userAnswers[currentQuestion.id]}
                        className="bg-blue-600 hover:bg-blue-700"
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

        {showResults && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-6"
          >
            {/* Score Summary */}
            <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-blue-50">
              <CardContent className="py-8 text-center">
                <div className="space-y-4">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <Trophy className="w-10 h-10 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-gray-900 mb-2">Quiz Complete!</h3>
                    <p className="text-gray-600">{getScoreMessage(score)}</p>
                  </div>
                  <div className="flex items-center justify-center gap-8 text-lg">
                    <div className="text-center">
                      <div className={`text-3xl font-bold ${getScoreColor(score)}`}>{score}%</div>
                      <div className="text-sm text-gray-500">Score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-gray-900">{correctAnswers}/{quizData.questions.length}</div>
                      <div className="text-sm text-gray-500">Correct</div>
                    </div>
                  </div>
                  <Button onClick={retakeQuiz} variant="outline" className="mt-4">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Retake Quiz
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Results */}
            <Card>
              <CardHeader>
                <CardTitle>Detailed Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {quizData.questions.map((question, index) => {
                  const userAnswer = userAnswers[question.id];
                  const isCorrect = userAnswer === question.correctAnswer;
                  
                  return (
                    <div key={question.id} className="border rounded-lg p-4">
                      <div className="flex items-start gap-3 mb-3">
                        {isCorrect ? (
                          <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-2">
                            Question {index + 1}: {question.question}
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className={`p-2 rounded ${isCorrect ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                              <strong>Your answer:</strong> {userAnswer || 'Not answered'}
                            </div>
                            {!isCorrect && (
                              <div className="p-2 bg-green-50 text-green-800 rounded">
                                <strong>Correct answer:</strong> {question.correctAnswer}
                              </div>
                            )}
                            <div className="p-2 bg-blue-50 text-blue-800 rounded">
                              <strong>Explanation:</strong> {question.explanation}
                            </div>
                          </div>
                        </div>
                      </div>
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
