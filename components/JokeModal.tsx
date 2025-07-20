
import React from 'react';
import { JokeIcon } from './icons/JokeIcon';

interface JokeModalProps {
  isOpen: boolean;
  isLoading: boolean;
  jokes: string[];
  onContinue: () => void;
}

export const JokeModal: React.FC<JokeModalProps> = ({ isOpen, isLoading, jokes, onContinue }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in" aria-modal="true" role="dialog">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
            <JokeIcon className="w-8 h-8 text-yellow-500"/>
            <h2 className="text-2xl font-bold text-slate-800">Joke Time!</h2>
        </div>

        <div className="min-h-[120px] flex items-center justify-center my-4">
        {isLoading ? (
          <div className="flex items-center gap-2 text-slate-600">
            <div className="w-6 h-6 border-2 border-dashed rounded-full animate-spin border-yellow-500"></div>
            <span>Thinking of some good ones...</span>
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in">
            {jokes.map((joke, index) => (
              <p key={index} className="text-lg text-slate-700 font-medium">
                {joke}
              </p>
            ))}
          </div>
        )}
        </div>
        
        <button
          onClick={onContinue}
          disabled={isLoading}
          className="w-full max-w-xs inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-lg shadow-blue-500/30 text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Loading...' : 'Continue Quiz'}
        </button>
      </div>
    </div>
  );
};
