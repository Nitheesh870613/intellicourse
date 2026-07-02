'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  CheckCircle, 
  XCircle, 
  RotateCcw, 
  Trophy, 
  Target,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

/**
 * Fallback Quiz Section Component
 * 
 * This component works without database dependency by generating
 * quiz questions based on chapter content using predefined templates
 */
export default function FallbackQuizSection({ chapterId, chapterTitle, chapterContent }) {
  // Quiz state
  const [quizData, setQuizData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Quiz interaction state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  
  // Results state
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);

  // Generate quiz questions based on chapter content
  useEffect(() => {
    if (chapterId && chapterTitle && chapterContent) {
      generateFallbackQuiz();
    }
  }, [chapterId, chapterTitle, chapterContent]);

  const generateFallbackQuiz = () => {
    setIsLoading(true);
    
    // Generate quiz questions based on chapter title and content
    const questions = createQuizQuestions(chapterTitle, chapterContent);
    
    const quizData = {
      chapterId: chapterId,
      chapterTitle: chapterTitle,
      difficulty: 'Beginner',
      questions: questions
    };

    setQuizData(quizData);
    setIsLoading(false);
  };

  const createQuizQuestions = (title, content) => {
    const questions = [];
    
    // Question templates based on chapter title
    const questionTemplates = {
      'Introduction to JavaScript': [
        {
          question: "What is JavaScript primarily used for?",
          options: ["Web development", "Database management", "Operating systems", "Hardware programming"],
          correctAnswer: "Web development",
          explanation: "JavaScript is primarily used for web development to create interactive web pages."
        },
        {
          question: "JavaScript is a _____ programming language.",
          options: ["High-level", "Low-level", "Assembly", "Machine"],
          correctAnswer: "High-level",
          explanation: "JavaScript is a high-level programming language that abstracts many complex details."
        },
        {
          question: "What does JavaScript enable on web pages?",
          options: ["Interactivity", "Static content", "Database storage", "Server hosting"],
          correctAnswer: "Interactivity",
          explanation: "JavaScript enables interactive features on web pages like dynamic content and user interactions."
        },
        {
          question: "JavaScript programs are called:",
          options: ["Scripts", "Applications", "Systems", "Drivers"],
          correctAnswer: "Scripts",
          explanation: "JavaScript programs are called scripts and can be embedded directly in HTML pages."
        }
      ],
      'Variables and Data Types': [
        {
          question: "Which keyword is used to declare a block-scoped variable in modern JavaScript?",
          options: ["let", "var", "const", "define"],
          correctAnswer: "let",
          explanation: "The 'let' keyword declares block-scoped variables in ES6 and later versions."
        },
        {
          question: "What are the primitive data types in JavaScript?",
          options: ["string, number, boolean, undefined, null, symbol", "string, number, object", "number, text, boolean", "integer, float, string"],
          correctAnswer: "string, number, boolean, undefined, null, symbol",
          explanation: "JavaScript has six primitive data types: string, number, boolean, undefined, null, and symbol."
        },
        {
          question: "Which keyword creates a constant variable?",
          options: ["const", "let", "var", "final"],
          correctAnswer: "const",
          explanation: "The 'const' keyword creates a constant variable that cannot be reassigned."
        },
        {
          question: "What happens when you try to access an undeclared variable?",
          options: ["ReferenceError", "undefined", "null", "0"],
          correctAnswer: "ReferenceError",
          explanation: "Accessing an undeclared variable throws a ReferenceError in JavaScript."
        }
      ],
      'Functions and Scope': [
        {
          question: "What is a closure in JavaScript?",
          options: ["A function with access to outer scope variables", "A closed function", "A function without parameters", "A built-in function"],
          correctAnswer: "A function with access to outer scope variables",
          explanation: "A closure is a function that has access to variables from an outer scope even after the outer function returns."
        },
        {
          question: "Which of these is NOT a way to declare a function?",
          options: ["function declaration", "function expression", "arrow function", "function variable"],
          correctAnswer: "function variable",
          explanation: "Functions can be declared using function declarations, expressions, or arrow functions, but not 'function variable'."
        },
        {
          question: "What is the scope of variables declared with 'let'?",
          options: ["Block scope", "Function scope", "Global scope", "Module scope"],
          correctAnswer: "Block scope",
          explanation: "Variables declared with 'let' have block scope, meaning they're only accessible within the block they're declared in."
        },
        {
          question: "Arrow functions were introduced in which version of JavaScript?",
          options: ["ES6", "ES5", "ES3", "ES7"],
          correctAnswer: "ES6",
          explanation: "Arrow functions were introduced in ES6 (ECMAScript 2015) as a more concise way to write functions."
        }
      ],
      'Arrays and Objects': [
        {
          question: "How do you add an element to the end of an array?",
          options: ["push()", "add()", "append()", "insert()"],
          correctAnswer: "push()",
          explanation: "The push() method adds one or more elements to the end of an array."
        },
        {
          question: "What is the correct way to create an empty object?",
          options: ["{}", "new Object()", "Object.create({})", "All of the above"],
          correctAnswer: "All of the above",
          explanation: "All these methods create an empty object: {}, new Object(), and Object.create({})."
        },
        {
          question: "Which method removes the last element from an array?",
          options: ["pop()", "remove()", "delete()", "splice()"],
          correctAnswer: "pop()",
          explanation: "The pop() method removes and returns the last element from an array."
        },
        {
          question: "How do you access object properties?",
          options: ["Dot notation and bracket notation", "Only dot notation", "Only bracket notation", "Arrow notation"],
          correctAnswer: "Dot notation and bracket notation",
          explanation: "Object properties can be accessed using both dot notation (obj.prop) and bracket notation (obj['prop'])."
        }
      ],
      'DOM Manipulation': [
        {
          question: "What does DOM stand for?",
          options: ["Document Object Model", "Data Object Model", "Dynamic Object Model", "Document Oriented Model"],
          correctAnswer: "Document Object Model",
          explanation: "DOM stands for Document Object Model, which represents the structure of HTML documents."
        },
        {
          question: "Which method is used to find an element by its ID?",
          options: ["getElementById()", "querySelector()", "findById()", "getElement()"],
          correctAnswer: "getElementById()",
          explanation: "The getElementById() method returns the element with the specified ID."
        },
        {
          question: "How do you change the content of an HTML element?",
          options: ["innerHTML or textContent", "changeContent()", "setContent()", "updateContent()"],
          correctAnswer: "innerHTML or textContent",
          explanation: "You can change element content using innerHTML (for HTML) or textContent (for plain text)."
        },
        {
          question: "Which method creates a new HTML element?",
          options: ["createElement()", "newElement()", "addElement()", "makeElement()"],
          correctAnswer: "createElement()",
          explanation: "The createElement() method creates a new HTML element that can be added to the DOM."
        }
      ],
      'Events and Event Handling': [
        {
          question: "Which method is used to attach an event listener?",
          options: ["addEventListener()", "attachEvent()", "onEvent()", "bindEvent()"],
          correctAnswer: "addEventListener()",
          explanation: "The addEventListener() method is the modern way to attach event listeners to elements."
        },
        {
          question: "What is event delegation?",
          options: ["Handling events on parent elements for child elements", "Passing events between functions", "Creating custom events", "Removing event listeners"],
          correctAnswer: "Handling events on parent elements for child elements",
          explanation: "Event delegation involves attaching event listeners to parent elements to handle events for child elements."
        },
        {
          question: "Which event fires when a page finishes loading?",
          options: ["load", "ready", "complete", "finish"],
          correctAnswer: "load",
          explanation: "The 'load' event fires when the page and all its resources have finished loading."
        },
        {
          question: "How do you prevent the default behavior of an event?",
          options: ["preventDefault()", "stopDefault()", "cancelEvent()", "blockEvent()"],
          correctAnswer: "preventDefault()",
          explanation: "The preventDefault() method prevents the default action associated with an event."
        }
      ],
      'Asynchronous JavaScript': [
        {
          question: "What is a Promise in JavaScript?",
          options: ["An object representing eventual completion of an async operation", "A synchronous function", "A type of variable", "A loop construct"],
          correctAnswer: "An object representing eventual completion of an async operation",
          explanation: "A Promise represents the eventual completion (or failure) of an asynchronous operation."
        },
        {
          question: "Which keyword is used with async functions to wait for promises?",
          options: ["await", "wait", "pause", "delay"],
          correctAnswer: "await",
          explanation: "The 'await' keyword is used inside async functions to wait for Promise resolution."
        },
        {
          question: "What are the three states of a Promise?",
          options: ["pending, fulfilled, rejected", "waiting, done, error", "start, running, complete", "new, active, finished"],
          correctAnswer: "pending, fulfilled, rejected",
          explanation: "Promises have three states: pending (initial), fulfilled (successful), and rejected (failed)."
        },
        {
          question: "What is a callback function?",
          options: ["A function passed as argument to another function", "A function that calls itself", "A built-in JavaScript function", "A function that returns a value"],
          correctAnswer: "A function passed as argument to another function",
          explanation: "A callback is a function passed as an argument to another function and executed after some operation."
        }
      ]
    };

    // Get questions for this chapter or create generic ones
    const chapterQuestions = questionTemplates[title] || createGenericQuestions(title, content);
    
    // Return 4 questions with unique IDs
    return chapterQuestions.slice(0, 4).map((q, index) => ({
      id: `${chapterId}-q${index + 1}`,
      ...q
    }));
  };

  const createGenericQuestions = (title, content) => {
    // Generic questions based on content
    return [
      {
        question: `What is the main topic of "${title}"?`,
        options: [title.split(' ').slice(-1)[0], "JavaScript", "Programming", "Web Development"],
        correctAnswer: title.split(' ').slice(-1)[0],
        explanation: `The main topic of this chapter is ${title.split(' ').slice(-1)[0]}.`
      },
      {
        question: `Which concept is most important in "${title}"?`,
        options: ["Understanding the fundamentals", "Memorizing syntax", "Speed of coding", "Using frameworks"],
        correctAnswer: "Understanding the fundamentals",
        explanation: "Understanding the fundamentals is always the most important aspect of learning any programming concept."
      },
      {
        question: `What should you focus on when learning about ${title.toLowerCase()}?`,
        options: ["Practical application", "Theory only", "Memorization", "Speed"],
        correctAnswer: "Practical application",
        explanation: "Practical application helps reinforce theoretical knowledge and builds real skills."
      },
      {
        question: `Why is ${title.toLowerCase()} important in JavaScript?`,
        options: ["It's a fundamental concept", "It's optional", "It's deprecated", "It's only for experts"],
        correctAnswer: "It's a fundamental concept",
        explanation: `${title} is a fundamental concept that forms the basis for more advanced JavaScript programming.`
      }
    ];
  };

  const startQuiz = () => {
    setQuizStarted(true);
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

  const submitQuiz = () => {
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
  };

  const retakeQuiz = () => {
    setQuizStarted(false);
    setShowResults(false);
    setUserAnswers({});
    setCurrentQuestionIndex(0);
    setScore(0);
    setCorrectAnswers(0);
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
            <p className="text-gray-600">Generating quiz questions...</p>
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
            <p className="text-gray-600">Unable to generate quiz for this chapter.</p>
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
              <span>{quizData.difficulty}</span>
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
                    This quiz contains {quizData.questions.length} multiple-choice questions about {quizData.chapterTitle}.
                  </p>
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
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    {currentQuestion.question}
                  </h3>

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
                        disabled={!allQuestionsAnswered}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Submit Quiz
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
