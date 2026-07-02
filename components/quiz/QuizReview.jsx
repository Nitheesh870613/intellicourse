'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Lightbulb, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function QuizReview({ questions, userAnswers, onBack }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Quiz Review</h2>
        <Button
          onClick={onBack}
          variant="outline"
          className="bg-white/5 border-white/20 text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {questions.map((question, index) => {
          const userAnswer = userAnswers[index];
          const correctAnswer = question.correctAnswer !== undefined 
            ? question.correctAnswer 
            : question.correct_answer;
          const isCorrect = userAnswer === correctAnswer;

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-white/5 backdrop-blur-xl rounded-xl p-6 border ${
                isCorrect
                  ? 'border-green-500/30 bg-green-500/5'
                  : 'border-red-500/30 bg-red-500/5'
              }`}
            >
              {/* Question Header */}
              <div className="flex items-start gap-3 mb-4">
                <div className={`p-2 rounded-lg ${
                  isCorrect ? 'bg-green-500/20' : 'bg-red-500/20'
                }`}>
                  {isCorrect ? (
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-sm text-white/60 mb-1">
                    Question {index + 1}
                  </div>
                  <div className="text-lg font-semibold text-white">
                    {question.question}
                  </div>
                </div>
              </div>

              {/* Options */}
              <div className="space-y-2 mb-4">
                {question.options?.map((option, optionIndex) => {
                  const isUserAnswer = userAnswer === optionIndex;
                  const isCorrectOption = correctAnswer === optionIndex;

                  return (
                    <div
                      key={optionIndex}
                      className={`p-3 rounded-lg border ${
                        isCorrectOption
                          ? 'border-green-500/50 bg-green-500/10'
                          : isUserAnswer
                          ? 'border-red-500/50 bg-red-500/10'
                          : 'border-white/10 bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                          isCorrectOption
                            ? 'bg-green-500 text-white'
                            : isUserAnswer
                            ? 'bg-red-500 text-white'
                            : 'bg-white/10 text-white/60'
                        }`}>
                          {String.fromCharCode(65 + optionIndex)}
                        </div>
                        <div className={`flex-1 ${
                          isCorrectOption || isUserAnswer
                            ? 'text-white font-medium'
                            : 'text-white/70'
                        }`}>
                          {option}
                        </div>
                        {isCorrectOption && (
                          <CheckCircle2 className="w-5 h-5 text-green-400" />
                        )}
                        {isUserAnswer && !isCorrect && (
                          <XCircle className="w-5 h-5 text-red-400" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Explanation */}
              {question.explanation && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Lightbulb className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-semibold text-blue-400 mb-1">
                        Explanation
                      </div>
                      <div className="text-sm text-white/80">
                        {question.explanation}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Answer Summary */}
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">
                    Your answer: <span className={isCorrect ? 'text-green-400' : 'text-red-400'}>
                      {userAnswer !== undefined 
                        ? String.fromCharCode(65 + userAnswer)
                        : 'Not answered'}
                    </span>
                  </span>
                  <span className="text-white/60">
                    Correct answer: <span className="text-green-400">
                      {String.fromCharCode(65 + correctAnswer)}
                    </span>
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/10">
        <div className="text-center">
          <div className="text-white/60 mb-2">Review Complete</div>
          <div className="text-2xl font-bold text-white">
            {Object.values(userAnswers).filter((answer, index) => 
              answer === (questions[index].correctAnswer !== undefined 
                ? questions[index].correctAnswer 
                : questions[index].correct_answer)
            ).length} / {questions.length} Correct
          </div>
        </div>
      </div>
    </div>
  );
}
