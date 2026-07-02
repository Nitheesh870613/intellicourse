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
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

/**
 * Structured Quiz Section Component
 * 
 * Uses the improved structured quiz generation API with proper
 * error handling, validation, and fallback mechanisms
 */
export default function StructuredQuizSection({ chapterId, courseId, onScoreUpdate }) {
  // Quiz state
  const [quizData, setQuizData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
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

  // Fetch or generate quiz on component mount
  useEffect(() => {
    if (chapterId) {
      fetchOrGenerateQuiz();
    }
  }, [chapterId]);

  const fetchOrGenerateQuiz = async (forceRegenerate = false) => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🔍 Fetching quiz for chapter:', chapterId);

      // First, try to fetch existing quiz
      if (!forceRegenerate) {
        const response = await fetch(`/api/generate-structured-quiz?chapterId=${chapterId}`);
        const data = await response.json();

        if (response.ok && data.success && data.hasQuiz) {
          console.log('✅ Found existing quiz');
          setQuizData(data.quiz);
          setIsLoading(false);
          return;
        }
      }

      // If no quiz exists or force regenerate, generate new one
      console.log('🧠 Generating new quiz...');
      setIsGenerating(true);
      
      const generateResponse = await fetch('/api/generate-structured-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          chapterId,
          courseId: courseId || null
        }),
      });

      const generateData = await generateResponse.json();

      if (generateResponse.ok && generateData.success) {
        console.log('✅ Quiz generated successfully');
        setQuizData(generateData.quiz);
      } else {
        console.error('❌ Quiz generation failed:', generateData);
        throw new Error(generateData.message || generateData.error || 'Failed to generate quiz');
      }

    } catch (err) {
      console.error('❌ Error in fetchOrGenerateQuiz:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
      setIsGenerating(false);
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
    if (currentQuestionIndex < quizData.quiz.length - 1) {
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
      quizData.quiz.forEach(question => {
        if (userAnswers[question.question_id] === question.correct_answer) {
          correct++;
        }
      });

      const totalQuestions = quizData.quiz.length;
      const scorePercentage = Math.round((correct / totalQuestions) * 100);

      setCorrectAnswers(correct);
      setScore(scorePercentage);
      setShowResults(true);

      // Save progress (optional - you can implement this)
      if (onScoreUpdate) {
        onScoreUpdate(scorePercentage, correct, totalQuestions);
      }

      console.log('📊 Quiz completed:', { score: scorePercentage, correct, total: totalQuestions });

    } catch (err) {
      console.error('❌ Error submitting quiz:', err);
    } finally {
      setIsSubmitting(false);
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

  const regenerateQuiz = () => {
    setQuizData(null);
    fetchOrGenerateQuiz(true);
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

  const getQuestionTypeIcon = (type) => {
    switch (type) {
      case 'mcq': return '🔘';
      case 'true_false': return '✓/✗';
      case 'fill_blank': return '📝';
      case 'code_output': return '💻';
      default: return '❓';
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
            <p className="text-gray-600">
              {isGenerating ? 'Generating quiz questions with AI...' : 'Loading quiz...'}
            </p>
            {isGenerating && (
              <p className="text-sm text-gray-500">This may take a few seconds</p>
            )}
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
            <h3 className="text-lg font-semibold text-red-800">Quiz Generation Failed</h3>
            <p className="text-red-600 max-w-md mx-auto">{error}</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => fetchOrGenerateQuiz()} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              <Button onClick={regenerateQuiz} className="bg-blue-600 hover:bg-blue-700">
                <Brain className="w-4 h-4 mr-2" />
                Regenerate Quiz
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No quiz data
  if (!quizData || !quizData.quiz || quizData.quiz.length === 0) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="py-8">
          <div className="text-center space-y-4">
            <Brain className="w-12 h-12 text-gray-400 mx-auto" />
            <h3 className="text-lg font-semibold text-gray-800">No Quiz Available</h3>
            <p className="text-gray-600">Unable to generate quiz questions for this chapter.</p>
            <Button onClick={regenerateQuiz} className="bg-blue-600 hover:bg-blue-700">
              <Brain className="w-4 h-4 mr-2" />
              Generate Quiz
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentQuestion = quizData.quiz[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quizData.quiz.length) * 100;
  const allQuestionsAnswered = quizData.quiz.every(q => userAnswers[q.question_id]);

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
                  {quizData.chapter_title}
                </CardTitle>
                <p className="text-blue-700 text-sm">
                  {quizData.chapter_summary || `Test your understanding with ${quizData.quiz.length} questions`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <Target className="w-4 h-4" />
                <span className="capitalize">{quizData.difficulty}</span>
              </div>
              <Button 
                onClick={regenerateQuiz} 
                variant="outline" 
                size="sm"
                className="text-xs"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                New Quiz
              </Button>
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
                    This AI-generated quiz contains {quizData.quiz.length} questions to test your understanding of the chapter content.
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
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4" />
                    <span>AI Generated</span>
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
                    Question {currentQuestionIndex + 1} of {quizData.quiz.length}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {getQuestionTypeIcon(currentQuestion.question_type)} {currentQuestion.question_type}
                    </span>
                    <span className="text-sm text-gray-500">{Math.round(progress)}% Complete</span>
                  </div>
                </div>
                <Progress value={progress} className="h-2" />
              </CardContent>
            </Card>

            {/* Current Question */}
            <Card>
              <CardContent className="py-8">
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm text-blue-600 font-medium">
                        {currentQuestion.question_id}
                      </span>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {currentQuestion.question_type}
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">
                      {currentQuestion.question_text}
                    </h3>
                  </div>

                  <div className="space-y-3">
                    {currentQuestion.options.map((option, index) => (
                      <label
                        key={index}
                        className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${
                          userAnswers[currentQuestion.question_id] === option
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`question-${currentQuestion.question_id}`}
                          value={option}
                          checked={userAnswers[currentQuestion.question_id] === option}
                          onChange={() => handleAnswerSelect(currentQuestion.question_id, option)}
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
                    {currentQuestionIndex < quizData.quiz.length - 1 ? (
                      <Button
                        onClick={nextQuestion}
                        disabled={!userAnswers[currentQuestion.question_id]}
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
                      <div className="text-3xl font-bold text-gray-900">{correctAnswers}/{quizData.quiz.length}</div>
                      <div className="text-sm text-gray-500">Correct</div>
                    </div>
                  </div>
                  <div className="flex gap-3 justify-center">
                    <Button onClick={retakeQuiz} variant="outline">
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Retake Quiz
                    </Button>
                    <Button onClick={regenerateQuiz} className="bg-blue-600 hover:bg-blue-700">
                      <Brain className="w-4 h-4 mr-2" />
                      New Quiz
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Results */}
            <Card>
              <CardHeader>
                <CardTitle>Detailed Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {quizData.quiz.map((question, index) => {
                  const userAnswer = userAnswers[question.question_id];
                  const isCorrect = userAnswer === question.correct_answer;
                  
                  return (
                    <div key={question.question_id} className="border rounded-lg p-4">
                      <div className="flex items-start gap-3 mb-3">
                        {isCorrect ? (
                          <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium text-gray-900">
                              {question.question_id}: {question.question_text}
                            </h4>
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {question.question_type}
                            </span>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className={`p-2 rounded ${isCorrect ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                              <strong>Your answer:</strong> {userAnswer || 'Not answered'}
                            </div>
                            {!isCorrect && (
                              <div className="p-2 bg-green-50 text-green-800 rounded">
                                <strong>Correct answer:</strong> {question.correct_answer}
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
