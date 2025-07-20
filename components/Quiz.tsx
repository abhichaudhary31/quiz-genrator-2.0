
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { type QuizQuestion, type IncorrectQuizQuestion, type QuizMode } from '../types';
import { getExplanationForQuestion, getJoke } from '../services/geminiService';
import { playCorrectSound, playIncorrectSound, playJokeSound } from '../services/audioService';
import { CheckIcon } from './icons/CheckIcon';
import { XIcon } from './icons/XIcon';
import { SadDogIcon } from './icons/SadDogIcon';
import { FlagIcon } from './icons/FlagIcon';
import { JokeModal } from './JokeModal';
import { DinoGameModal } from './DinoGameModal';
import { SnakeGameModal } from './SnakeGameModal';
import { GameSelectionModal } from './GameSelectionModal';
import { ExhibitModal } from './ExhibitModal';
import { ImageIcon } from './icons/ImageIcon';
import { RefreshIcon } from './icons/RefreshIcon';

interface QuizProps {
  questions: QuizQuestion[];
  onComplete: (score: number, incorrectQuestions: IncorrectQuizQuestion[]) => void;
  mode: QuizMode;
  isProcessingComplete: boolean;
  onFlagQuestion: (questionIndex: number) => void;
  flaggedIndices: number[];
  onPreloadRequired: () => void;
  currentQuestionIndex: number;
  onNavigate: (indexOrUpdater: number | ((prev: number) => number)) => void;
  onRegenerate: () => void;
  isRegenerating: boolean;
  canRegenerate: boolean;
}

const goodVibesMessages = [
  "You're on fire! 🔥 Paddu 😘",
  "Great job, keep it up! BOO BOO ✨",
  "Amazing streak!  🚀",
  "You're a genius! BABY 🧠",
  "Nothing can stop you! Ab goal dur nahi 💪"
];

const areArraysEqual = (arr1: string[], arr2: string[]): boolean => {
  if (arr1.length !== arr2.length) return false;
  const sortedArr1 = [...arr1].sort();
  const sortedArr2 = [...arr2].sort();
  return sortedArr1.every((value, index) => value === sortedArr2[index]);
};

export const Quiz: React.FC<QuizProps> = ({ 
  questions, 
  onComplete, 
  mode, 
  isProcessingComplete, 
  onFlagQuestion, 
  flaggedIndices, 
  onPreloadRequired,
  currentQuestionIndex,
  onNavigate,
  onRegenerate,
  isRegenerating,
  canRegenerate
}) => {
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [incorrectlyAnswered, setIncorrectlyAnswered] = useState<IncorrectQuizQuestion[]>([]);
  const [showDog, setShowDog] = useState(false);
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
  const [showStreakMessage, setShowStreakMessage] = useState<string | null>(null);
  const [showLove, setShowLove] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isExplanationLoading, setIsExplanationLoading] = useState(false);
  
  // State for new features
  const [showGameSelection, setShowGameSelection] = useState(false);
  const [selectedGame, setSelectedGame] = useState<'dino' | 'snake' | null>(null);
  const [showJokeModal, setShowJokeModal] = useState(false);
  const [currentJokes, setCurrentJokes] = useState<string[]>([]);
  const [isJokeLoading, setIsJokeLoading] = useState(false);
  const [showExhibitModal, setShowExhibitModal] = useState(false);

  const currentQuestion = useMemo(() => questions[currentQuestionIndex], [questions, currentQuestionIndex]);
  const progressPercentage = (currentQuestionIndex / questions.length) * 100;
  
  const isLastAvailableQuestion = currentQuestionIndex === questions.length - 1;

  // Effect to handle preloading of the next question chunk
  useEffect(() => {
    const shouldPreload = !isProcessingComplete && questions.length > 1 && currentQuestionIndex === questions.length - 2;

    if (shouldPreload) {
        onPreloadRequired();
    }
  }, [currentQuestionIndex, questions.length, isProcessingComplete, onPreloadRequired]);
  
  // Effect to reset local state when navigating to a new question
  useEffect(() => {
    setSelectedAnswers([]);
    setIsAnswered(false);
    setShowLove(false);
    setExplanation(null);
    setIsExplanationLoading(false);
  }, [currentQuestionIndex]);


  if (!currentQuestion) {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-center">
         <div className="flex items-center gap-2 text-slate-600">
            <div className="w-6 h-6 border-2 border-dashed rounded-full animate-spin border-blue-500"></div>
            <span>Loading quiz...</span>
          </div>
      </div>
    );
  }

  const triggerConfettiRain = () => {
    const end = Date.now() + 2 * 1000;
    const colors = ['#60a5fa', '#34d399', '#facc15', '#f87171', '#a78bfa'];
    (function frame() {
      confetti({ particleCount: 2, angle: 60, spread: 55, origin: { x: 0 }, colors });
      confetti({ particleCount: 2, angle: 120, spread: 55, origin: { x: 1 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  };

  const handleOptionToggle = useCallback((option: string) => {
    if (isAnswered) return;
    setSelectedAnswers(prev => 
      prev.includes(option) ? prev.filter(item => item !== option) : [...prev, option]
    );
  }, [isAnswered]);
  
  const handleSubmitAnswer = async () => {
    if (isAnswered || selectedAnswers.length === 0) return;

    const isScorable = currentQuestion.answer.length > 0;
    setIsAnswered(true);

    if (isScorable) {
      const isCorrect = areArraysEqual(selectedAnswers, currentQuestion.answer);
      if (isCorrect) {
        playCorrectSound();
        setScore(prev => prev + 1);
        setConsecutiveCorrect(prev => prev + 1);
        triggerConfettiRain();
        setShowLove(true);
      } else {
        playIncorrectSound();
        setConsecutiveCorrect(0);
        setIncorrectlyAnswered(prev => [...prev, { ...currentQuestion, userAnswers: selectedAnswers }]);
        setShowDog(true);
        setTimeout(() => setShowDog(false), 2000);
      }
    }
    
    if (mode === 'learn') {
      if (isScorable) {
        setIsExplanationLoading(true);
        const fetchedExplanation = await getExplanationForQuestion(currentQuestion);
        setExplanation(fetchedExplanation);
        setIsExplanationLoading(false);
      } else {
        setExplanation("The correct answer for this question was not provided in the document, so no explanation can be generated.");
      }
    }
  };
  
  useEffect(() => {
    if (consecutiveCorrect > 0 && consecutiveCorrect % 3 === 0) {
      const message = goodVibesMessages[Math.floor(Math.random() * goodVibesMessages.length)];
      setShowStreakMessage(message);
      setTimeout(() => setShowStreakMessage(null), 2500);
    }
  }, [consecutiveCorrect]);

  const goToNextQuestion = useCallback(() => {
      onNavigate(prev => prev + 1);
  }, [onNavigate]);

  const handleContinueFromBreak = useCallback(() => {
    setShowGameSelection(false);
    setSelectedGame(null);
    setShowJokeModal(false);
    setCurrentJokes([]);
    goToNextQuestion();
  }, [goToNextQuestion]);

  const handleGameSelect = (game: 'dino' | 'snake') => {
    setSelectedGame(game);
    setShowGameSelection(false);
  };

  const handleNextClick = () => {
    const questionNumber = currentQuestionIndex + 1;

    if (isLastAvailableQuestion && isProcessingComplete) {
      onComplete(score, incorrectlyAnswered);
      return;
    }
    
    if (questions.length <= questionNumber) {
      return;
    }
    
    const isDistractionEnabled = mode !== 'focus';

    if (isDistractionEnabled && questionNumber > 0 && questionNumber % 20 === 0) {
      setShowJokeModal(true);
      setIsJokeLoading(true);
      Promise.all([getJoke(), getJoke()]).then(jokes => {
        setCurrentJokes(jokes);
        setIsJokeLoading(false);
        playJokeSound();
      });
    } else if (isDistractionEnabled && questionNumber > 0 && questionNumber % 30 === 0) {
      setShowGameSelection(true);
    } else {
      goToNextQuestion();
    }
  };

  const getButtonClasses = (option: string) => {
    const baseClasses = 'w-full flex items-center text-left p-4 rounded-lg border-2 transition-all duration-300';
    const isSelected = selectedAnswers.includes(option);
    if (isAnswered) {
      const isScorable = currentQuestion.answer.length > 0;
      if (isScorable) {
        const isCorrectAnswer = currentQuestion.answer.includes(option);
        if (isCorrectAnswer) return `${baseClasses} bg-green-100 border-green-500 text-green-800 cursor-default`;
        if (isSelected && !isCorrectAnswer) return `${baseClasses} bg-red-100 border-red-500 text-red-800 cursor-default animate-shake`;
      } else {
         if (isSelected) return `${baseClasses} bg-blue-100 border-blue-500 cursor-default`;
      }
      return `${baseClasses} bg-slate-100 border-slate-300 text-slate-500 cursor-default`;
    }
    if (isSelected) return `${baseClasses} bg-yellow-100 border-yellow-500 cursor-pointer`;
    return `${baseClasses} bg-white/80 hover:bg-yellow-50 border-slate-300 cursor-pointer`;
  };
  
  const getIcon = (option: string) => {
    const isSelected = selectedAnswers.includes(option);
    if (!isAnswered) {
      return <div className={`w-6 h-6 rounded-md border-2 ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-slate-400'}`}>{isSelected && <CheckIcon className="w-5 h-5 text-white" />}</div>;
    }
    const isScorable = currentQuestion.answer.length > 0;
    if(isScorable) {
      const isCorrectAnswer = currentQuestion.answer.includes(option);
      if(isCorrectAnswer) return <div className="flex items-center gap-2">{showLove && areArraysEqual(selectedAnswers, currentQuestion.answer) && <span className="text-red-500 animate-pop-in">❤️</span>}<CheckIcon className="w-6 h-6 text-green-600" /></div>;
      if(isSelected && !isCorrectAnswer) return <XIcon className="w-6 h-6 text-red-600" />;
    } else {
        if (isSelected) return <div className="w-6 h-6 rounded-md border-2 bg-blue-500 border-blue-500"><CheckIcon className="w-5 h-5 text-white" /></div>;
    }
    return <div className="w-6 h-6 rounded-md border-2 border-transparent" />; 
  };

  return (
    <div className="w-full relative p-6 md:p-8">
       <div className="absolute top-0 left-0 right-0"><div className="w-full progress-bar"><div className="progress-bar-inner" style={{ width: `${progressPercentage}%` }}></div></div></div>
       {showStreakMessage && <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-green-400 text-slate-800 font-bold py-2 px-6 rounded-lg shadow-lg animate-fade-in-down z-20">{showStreakMessage}</div>}
       {showDog && <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-fade-in"><SadDogIcon /></div>}
        {isRegenerating && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-20 animate-fade-in">
                <div className="flex items-center gap-2 text-slate-600">
                    <div className="w-5 h-5 border-2 border-dashed rounded-full animate-spin border-blue-500"></div>
                    <span>Regenerating questions...</span>
                </div>
            </div>
        )}

      <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-blue-600">Question {currentQuestionIndex + 1}<span className="text-base font-normal text-slate-500">/{questions.length || '?'}</span></h2>
          <div className="flex items-center gap-2">
            <div className="text-lg font-semibold">Score: <span className="text-green-500">{score}</span></div>
            <button 
                onClick={onRegenerate} 
                disabled={!canRegenerate}
                title="Regenerate this set of questions" 
                className="p-1 rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-600 disabled:text-slate-300 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
            >
                <RefreshIcon className="w-5 h-5" />
            </button>
            <button onClick={() => onFlagQuestion(currentQuestionIndex)} title="Flag question for review" className="p-1 rounded-full hover:bg-slate-200 transition-colors"><FlagIcon className={`w-5 h-5 ${flaggedIndices.includes(currentQuestionIndex) ? 'text-red-500 fill-current' : 'text-slate-400'}`} /></button>
          </div>
      </div>
      
      <div className="relative">
        <p className="text-lg font-semibold mb-2 text-slate-800">{currentQuestion.question}</p>
        {currentQuestion.hasImage && (
          <button 
              onClick={() => setShowExhibitModal(true)} 
              className="flex items-center gap-2 mb-4 px-3 py-1 bg-sky-100 text-sky-700 rounded-md hover:bg-sky-200 transition-colors text-sm font-semibold"
          >
              <ImageIcon className="w-4 h-4" />
              Show Exhibit
          </button>
        )}
        <p className="text-sm text-slate-500 mb-6">{currentQuestion.answer.length > 1 ? 'This question may have multiple correct answers. Select all that apply.' : 'This question has one correct answer.'}</p>
        <div className="space-y-3">{currentQuestion.options.map((option, index) => <button key={index} className={getButtonClasses(option)} onClick={() => handleOptionToggle(option)} disabled={isAnswered}><span className="flex-grow mr-4">{option}</span>{getIcon(option)}</button>)}</div>
      </div>
      
      <div className="mt-6 min-h-[60px] flex flex-col justify-center">
        {!isAnswered ? (
          <div className="text-center"><button onClick={handleSubmitAnswer} disabled={selectedAnswers.length === 0} className="w-full max-w-xs inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-lg shadow-green-500/30 text-white bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-slate-400 disabled:cursor-not-allowed disabled:shadow-none transition-colors">Submit Answer</button></div>
        ) : (
           <div className="text-center"><button onClick={handleNextClick} className="w-full max-w-xs inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-lg shadow-blue-500/30 text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors animate-fade-in">{isLastAvailableQuestion && isProcessingComplete ? 'Finish Quiz' : 'Next Question'}</button></div>
        )}
        {isLastAvailableQuestion && !isProcessingComplete && <div className="mt-4 flex items-center justify-center gap-2 text-slate-500 animate-fade-in"><div className="w-4 h-4 border-2 border-dashed rounded-full animate-spin border-blue-500"></div><span>Loading more questions...</span></div>}
      </div>

       {isAnswered && mode === 'learn' && <div className="mt-6 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400 animate-fade-in"><h3 className="text-lg font-bold text-blue-700 mb-2">Explanation</h3>{isExplanationLoading ? <div className="flex items-center gap-2 text-slate-600"><div className="w-4 h-4 border-2 border-dashed rounded-full animate-spin border-blue-500"></div><span>Generating explanation...</span></div> : <p className="text-slate-700 whitespace-pre-wrap">{explanation}</p>}</div>}
    
      <GameSelectionModal 
         isOpen={showGameSelection} 
         onSelectGame={handleGameSelect}
         onContinueQuiz={handleContinueFromBreak}
       />
       {selectedGame === 'dino' && <DinoGameModal isOpen={true} onContinue={handleContinueFromBreak} />}
       {selectedGame === 'snake' && <SnakeGameModal isOpen={true} onContinue={handleContinueFromBreak} />}
       <JokeModal isOpen={showJokeModal} isLoading={isJokeLoading} jokes={currentJokes} onContinue={handleContinueFromBreak} />
       <ExhibitModal 
        isOpen={showExhibitModal}
        pageData={currentQuestion.pageData}
        onClose={() => setShowExhibitModal(false)}
       />
    </div>
  );
};
