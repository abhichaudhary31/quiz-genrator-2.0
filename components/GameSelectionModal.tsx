
import React from 'react';
import { DinoIcon } from './icons/DinoIcon';
import { SnakeIcon } from './icons/SnakeIcon';

interface GameSelectionModalProps {
  isOpen: boolean;
  onSelectGame: (game: 'dino' | 'snake') => void;
  onContinueQuiz: () => void;
}

export const GameSelectionModal: React.FC<GameSelectionModalProps> = ({ isOpen, onSelectGame, onContinueQuiz }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in" aria-modal="true" role="dialog">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Game Break!</h2>
        <p className="text-slate-600 mb-6">Choose a mini-game to play or continue the quiz.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Dino Game Option */}
            <div 
                onClick={() => onSelectGame('dino')}
                className="p-6 bg-slate-100 rounded-lg border-2 border-transparent hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all duration-300 flex flex-col items-center"
            >
                <DinoIcon className="w-16 h-16 text-slate-700 mb-3"/>
                <h3 className="text-xl font-semibold text-slate-800">Dino Dash</h3>
                <p className="text-sm text-slate-500 mt-1">Jump over obstacles!</p>
            </div>

            {/* Snake Game Option */}
            <div 
                onClick={() => onSelectGame('snake')}
                className="p-6 bg-slate-100 rounded-lg border-2 border-transparent hover:border-green-500 hover:bg-green-50 cursor-pointer transition-all duration-300 flex flex-col items-center"
            >
                <SnakeIcon className="w-16 h-16 text-green-500 mb-3"/>
                <h3 className="text-xl font-semibold text-slate-800">Pixel Python</h3>
                <p className="text-sm text-slate-500 mt-1">Eat and grow!</p>
            </div>
        </div>

        <button
          onClick={onContinueQuiz}
          className="mt-8 w-full max-w-xs inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-lg shadow-blue-500/30 text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          Continue Quiz
        </button>
      </div>
    </div>
  );
};
