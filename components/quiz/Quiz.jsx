'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Trophy, RotateCcw } from 'lucide-react';

// Individual question components
function MultipleChoiceQuestion({ question, answer, onChange, showResult, correctAnswer }) {
  const isCorrect = showResult && answer === correctAnswer;
  const isIncorrect = showResult && answer && answer !== correctAnswer;

  return (
    <div className="space-y-4">
      <p className="text-base sm:text-lg text-white font-medium">{question.question}</p>
      
      <RadioGroup value={answer || ''} onValueChange={onChange} disabled={showResult}>
        <div className="space-y-3">
          {question.options.map((option, idx) => {
            const isThisCorrect = showResult && option === correctAnswer;
            const isThisIncorrect = showResult && option === answer && option !== correctAnswer;
            
            return (
              <motion.div
                key={idx}
                className={`flex items-center space-x-3 p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer ${
                  isThisCorrect
                    ? 'bg-green-500/20 border-green-400'
                    : isThisIncorrect
                    ? 'bg-red-500/20 border-red-400'
                    : answer === option && !showResult
                    ? 'bg-purple-500/20 border-purple-400'
                    : 'bg-white/5 border-white/20 hover:border-purple-400/50 hover:bg-white/10'
                }`}
                whileHover={!showResult ? { scale: 1.02 } : {}}
                whileTap={!showResult ? { scale: 0.98 } : {}}
              >
                <RadioGroupItem
                  value={option}
                  id={`option-${idx}`}
                  className="text-purple-500"
                />
                <Label
                  htmlFor={`option-${idx}`}
                  className="flex-1 text-white cursor-pointer"
                >
                  {option}
                </Label>
                {isThisCorrect && <CheckCircle2 className="w-5 h-5 text-green-400" />}
                {isThisIncorrect && <XCircle className="w-5 h-5 text-red-400" />}
              </motion.div>
            );
          })}
        </div>
      </RadioGroup>
    </div>
  );
}

function TrueFalseQuestion({ question, answer, onChange, showResult, correctAnswer }) {
  const isCorrect = showResult && answer === correctAnswer;
  const isIncorrect = showResult && answer !== null && answer !== correctAnswer;

  return (
    <div className="space-y-4">
      <p className="text-base sm:text-lg text-white font-medium">{question.question}</p>
      
      <div className="grid grid-cols-2 gap-4">
        {[true, false].map((value) => {
          const isThisCorrect = showResult && value === correctAnswer;
          const isThisIncorrect = showResult && value === answer && value !== correctAnswer;
          
          return (
            <motion.button
              key={value.toString()}
              onClick={() => !showResult && onChange(value)}
              disabled={showResult}
              className={`p-4 rounded-xl border-2 font-semibold text-lg transition-all duration-300 ${
                isThisCorrect
                  ? 'bg-green-500/20 border-green-400 text-green-300'
                  : isThisIncorrect
                  ? 'bg-red-500/20 border-red-400 text-red-300'
                  : answer === value && !showResult
                  ? 'bg-purple-500/20 border-purple-400 text-purple-300'
                  : 'bg-white/5 border-white/20 text-white hover:border-purple-400/50 hover:bg-white/10'
              }`}
              whileHover={!showResult ? { scale: 1.05 } : {}}
              whileTap={!showResult ? { scale: 0.95 } : {}}
            >
              <div className="flex items-center justify-center space-x-2">
                <span>{value ? 'True' : 'False'}</span>
                {isThisCorrect && <CheckCircle2 className="w-5 h-5" />}
                {isThisIncorrect && <XCircle className="w-5 h-5" />}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function FillInBlankQuestion({ question, answer, onChange, showResult, correctAnswer }) {
  const normalizedAnswer = answer?.trim().toLowerCase() || '';
  const normalizedCorrect = correctAnswer?.trim().toLowerCase() || '';
  const isCorrect = showResult && normalizedAnswer === normalizedCorrect;
  const isIncorrect = showResult && normalizedAnswer && normalizedAnswer !== normalizedCorrect;

  return (
    <div className="space-y-4">
      <p className="text-base sm:text-lg text-white font-medium">
        {question.question.replace('______', '_______')}
      </p>
      
      <div className="relative">
        <Input
          value={answer || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type your answer..."
          disabled={showResult}
          className={`w-full h-14 text-base sm:text-lg px-4 border-2 transition-all duration-300 ${
            isCorrect
              ? 'bg-green-500/10 border-green-400 text-green-300'
              : isIncorrect
              ? 'bg-red-500/10 border-red-400 text-red-300'
              : 'bg-white/10 border-white/20 text-white focus:border-purple-400'
          } rounded-xl`}
        />
        {showResult && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            {isCorrect ? (
              <CheckCircle2 className="w-6 h-6 text-green-400" />
            ) : (
              <XCircle className="w-6 h-6 text-red-400" />
            )}
          </div>
        )}
      </div>
      
      {showResult && !isCorrect && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-green-500/10 rounded-lg border border-green-400/30"
        >
          <p className="text-sm text-green-300">
            <strong>Correct Answer:</strong> {correctAnswer}
          </p>
        </motion.div>
      )}
    </div>
  );
}

// Main Quiz Component
export default function Quiz({ questions, moduleTitle }) {
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(null);

  const handleAnswerChange = (questionIndex, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }));
  };

  const handleSubmit = () => {
    let correct = 0;
    
    questions.forEach((question, index) => {
      const userAnswer = answers[index];
      
      if (question.type === 'fill_in_the_blank') {
        const normalizedUser = String(userAnswer || '').trim().toLowerCase();
        const normalizedCorrect = String(question.answer).trim().toLowerCase();
        if (normalizedUser === normalizedCorrect) correct++;
      } else if (question.type === 'true_false') {
        if (userAnswer === question.answer) correct++;
      } else if (question.type === 'multiple_choice') {
        if (userAnswer === question.answer) correct++;
      }
    });
    
    setScore(correct);
    setShowResults(true);
  };

  const handleReset = () => {
    setAnswers({});
    setShowResults(false);
    setScore(null);
  };

  const allAnswered = questions.every((_, index) => answers[index] !== undefined && answers[index] !== null && answers[index] !== '');
  const percentage = score !== null ? Math.round((score / questions.length) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <Card className="border-0 bg-black/20 backdrop-blur-xl shadow-2xl border-green-500/20">
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl text-white bg-gradient-to-r from-white via-green-200 to-emerald-200 bg-clip-text text-transparent">
            📝 Quiz: {moduleTitle}
          </CardTitle>
          <p className="text-sm text-white/70">
            Test your understanding of this module ({questions.length} questions)
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {questions.map((question, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center border border-purple-400/30">
                      <span className="text-sm font-bold text-purple-300">{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      {question.type === 'multiple_choice' && (
                        <MultipleChoiceQuestion
                          question={question}
                          answer={answers[index]}
                          onChange={(value) => handleAnswerChange(index, value)}
                          showResult={showResults}
                          correctAnswer={question.answer}
                        />
                      )}
                      {question.type === 'true_false' && (
                        <TrueFalseQuestion
                          question={question}
                          answer={answers[index]}
                          onChange={(value) => handleAnswerChange(index, value)}
                          showResult={showResults}
                          correctAnswer={question.answer}
                        />
                      )}
                      {question.type === 'fill_in_the_blank' && (
                        <FillInBlankQuestion
                          question={question}
                          answer={answers[index]}
                          onChange={(value) => handleAnswerChange(index, value)}
                          showResult={showResults}
                          correctAnswer={question.answer}
                        />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            {!showResults ? (
              <Button
                onClick={handleSubmit}
                disabled={!allAnswered}
                className="flex-1 h-14 text-lg font-semibold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-xl"
              >
                Check Answers
              </Button>
            ) : (
              <Button
                onClick={handleReset}
                className="flex-1 h-14 text-lg font-semibold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-xl"
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                Try Again
              </Button>
            )}
          </div>

          <AnimatePresence>
            {showResults && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="mt-6"
              >
                <Card className={`border-2 ${
                  percentage >= 80
                    ? 'bg-green-500/10 border-green-400'
                    : percentage >= 60
                    ? 'bg-yellow-500/10 border-yellow-400'
                    : 'bg-red-500/10 border-red-400'
                }`}>
                  <CardContent className="p-6 text-center">
                    <Trophy className={`w-16 h-16 mx-auto mb-4 ${
                      percentage >= 80
                        ? 'text-green-400'
                        : percentage >= 60
                        ? 'text-yellow-400'
                        : 'text-red-400'
                    }`} />
                    <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                      Your Score: {score} / {questions.length}
                    </h3>
                    <p className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent mb-4">
                      {percentage}%
                    </p>
                    <p className="text-white/70">
                      {percentage >= 80
                        ? '🎉 Excellent work! You have mastered this module.'
                        : percentage >= 60
                        ? '👍 Good job! Review the incorrect answers to improve.'
                        : '💪 Keep practicing! Review the module content and try again.'}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}
