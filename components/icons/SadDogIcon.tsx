import React from 'react';

export const SadDogIcon: React.FC = () => {
  return (
    <div className="bg-white/95 dark:bg-slate-800/95 p-8 rounded-2xl shadow-2xl flex flex-col items-center">
        <svg 
            className="w-32 h-32 animate-dog-shake text-slate-600 dark:text-slate-300"
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            {/* Head */}
            <path d="M12 2a9 9 0 0 0-9 9v3.5a2.5 2.5 0 0 0 2.5 2.5h13A2.5 2.5 0 0 0 21 14.5V11a9 9 0 0 0-9-9z" />
            {/* Ears */}
            <path d="M5 11v1.5a2.5 2.5 0 1 1-5 0V11" />
            <path d="M19 11v1.5a2.5 2.5 0 1 0 5 0V11" />
            {/* Eyes */}
            <circle cx="9.5" cy="11.5" r="0.5" fill="currentColor" />
            <circle cx="14.5" cy="11.5" r="0.5" fill="currentColor" />
            {/* Sad Mouth */}
            <path d="M10 16s.5-1 2-1 2 1 2 1" />
        </svg>
      <p className="mt-4 text-xl font-bold text-center text-slate-700 dark:text-slate-200">
        Oops! Not quite.
      </p>
    </div>
  );
};
