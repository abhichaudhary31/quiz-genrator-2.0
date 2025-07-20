
import React from 'react';
import { type QuizQuestion, type IncorrectQuizQuestion } from '../types';
import { CheckIcon } from './icons/CheckIcon';
import { XIcon } from './icons/XIcon';
import { FlagIcon } from './icons/FlagIcon';


interface QuizResultProps {
  score: number;
  totalQuestions: number;
  scorableQuestionsCount: number;
  incorrectQuestions: IncorrectQuizQuestion[];
  flaggedQuestions: QuizQuestion[];
  onRetry: () => void;
  onRequiz: () => void;
}

export const QuizResult: React.FC<QuizResultProps> = ({ score, totalQuestions, scorableQuestionsCount, incorrectQuestions, flaggedQuestions, onRetry, onRequiz }) => {
  const percentage = scorableQuestionsCount > 0 ? Math.round((score / scorableQuestionsCount) * 100) : 0;
  const unscorableCount = totalQuestions - scorableQuestionsCount;

  const getFeedback = () => {
    if (scorableQuestionsCount === 0) return "Quiz complete! No scorable questions were found.";
    if (percentage === 100) return "Perfect Score! You're a genius!";
    if (percentage >= 80) return "Excellent work! You really know your stuff.";
    if (percentage >= 60) return "Good job! A little more practice and you'll be an expert.";
    if (percentage >= 40) return "Not bad, but there's room for improvement.";
    return "Keep practicing! You'll get there.";
  };

  return (
    <div className="text-center p-2 sm:p-6 flex flex-col items-center animate-fade-in">
      <h2 className="text-3xl font-bold text-slate-800 mb-2">Quiz Complete!</h2>
      <p className="text-lg text-slate-600 mb-6">{getFeedback()}</p>
      
      {scorableQuestionsCount > 0 && (
          <div className="relative w-48 h-48 mb-6">
            <svg className="w-full h-full" viewBox="0 0 36 36">
              <path
                className="text-slate-200"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none" stroke="currentColor" strokeWidth="3"
              />
              <path
                className="text-green-500 animate-score"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none" stroke="currentColor" strokeWidth="3"
                strokeDasharray={`${percentage}, 100`} strokeLinecap="round" transform="rotate(-90 18 18)"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold text-slate-800">{percentage}%</span>
              <span className="text-slate-500">Score</span>
            </div>
          </div>
      )}
      
      {scorableQuestionsCount > 0 && (
          <p className="text-xl text-slate-700">
            You answered <span className="font-bold text-blue-500">{score}</span> out of <span className="font-bold text-blue-500">{scorableQuestionsCount}</span> scorable questions correctly.
          </p>
      )}

      {unscorableCount > 0 && (
         <p className="text-md text-slate-500 mt-2">
            <span className="font-semibold">{unscorableCount}</span> question{unscorableCount > 1 ? 's were' : ' was'} not scored because no answer was provided.
         </p>
      )}


      {incorrectQuestions.length > 0 && (
        <div className="mt-8 w-full border-t border-slate-200 pt-6">
          <h3 className="text-2xl font-bold mb-4 text-slate-800">Review Your Answers</h3>
          <div className="space-y-4 text-left">
            {incorrectQuestions.map((q, index) => (
              <div key={index} className="p-4 rounded-lg bg-yellow-100/60">
                <p className="font-semibold mb-2">{q.question}</p>
                <div className="text-sm">
                  <p className="font-bold text-red-600">Your Answer:</p>
                  <ul className="list-disc list-inside ml-2">
                    {q.userAnswers.map(ans => <li key={ans}>{ans}</li>)}
                  </ul>
                </div>
                <div className="text-sm mt-2">
                   <p className="font-bold text-green-600">Correct Answer:</p>
                   <ul className="list-disc list-inside ml-2">
                    {q.answer.map(ans => <li key={ans}>{ans}</li>)}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {flaggedQuestions.length > 0 && (
        <div className="mt-8 w-full border-t border-slate-200 pt-6">
          <h3 className="text-2xl font-bold mb-4 text-slate-800 flex items-center justify-center gap-2">
            <FlagIcon className="w-6 h-6 text-red-500" />
            Flagged for Review
          </h3>
          <div className="space-y-4 text-left">
            {flaggedQuestions.map((q, index) => (
              <div key={index} className="p-4 rounded-lg bg-blue-100/60">
                <p className="font-semibold mb-2">{q.question}</p>
                <div className="text-sm">
                   <p className="font-bold text-slate-600">Options Provided:</p>
                   <ul className="list-disc list-inside ml-2">
                    {q.options.map(opt => <li key={opt}>{opt}</li>)}
                  </ul>
                </div>
                 {q.answer.length > 0 && (
                    <div className="text-sm mt-2">
                      <p className="font-bold text-green-600">Correct Answer(s):</p>
                      <ul className="list-disc list-inside ml-2">
                        {q.answer.map(ans => <li key={ans}>{ans}</li>)}
                      </ul>
                    </div>
                 )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 flex flex-col sm:flex-row gap-4 w-full justify-center">
        {incorrectQuestions.length > 0 && (
          <button
            onClick={onRequiz}
            className="w-full max-w-xs inline-flex justify-center items-center gap-2 px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-lg shadow-green-500/30 text-white bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 0 1-9.201-4.42 5.5 5.5 0 0 1 10.89 2.166l.334 2.336a.75.75 0 1 1-1.48.212l-.334-2.336a4.002 4.002 0 0 0-7.923-1.572.75.75 0 0 1-1.06-1.061 5.5 5.5 0 0 1 9.201 4.42Z" clipRule="evenodd" /><path fillRule="evenodd" d="M16.75 10.5a.75.75 0 0 1 .75.75v3.5a2 2 0 0 1-2 2h-6.5a2 2 0 0 1-2-2v-3.5a.75.75 0 0 1 1.5 0v3.5a.5.5 0 0 0 .5.5h6.5a.5.5 0 0 0 .5-.5v-3.5a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" /></svg>
            Practice ({incorrectQuestions.length})
          </button>
        )}
        <button
          onClick={onRetry}
          className="w-full max-w-xs inline-flex justify-center items-center gap-2 px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-lg shadow-blue-500/30 text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M12 9.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z" /><path fillRule="evenodd" d="M.94 6.44a.75.75 0 0 1 0-1.061l3.06-3.06a.75.75 0 1 1 1.061 1.06L2.56 5.94l2.5 2.5a.75.75 0 1 1-1.06 1.061l-3.06-3.061ZM19.06 13.56a.75.75 0 0 1 0 1.061l-3.06 3.06a.75.75 0 1 1-1.061-1.06L17.44 14.06l-2.5-2.5a.75.75 0 1 1 1.06-1.061l3.06 3.061Z" clipRule="evenodd" /></svg>
           Try Another Quiz
        </button>
      </div>
    </div>
  );
};
