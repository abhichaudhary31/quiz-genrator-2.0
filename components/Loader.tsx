
import React, { useState, useEffect } from 'react';
import { PencilLoaderIcon } from './icons/PencilLoaderIcon';

const defaultMessages = [
  "Analyzing PDF structure...",
  "Identifying potential questions...",
  "Asking Gemini to build your quiz...",
  "Polishing the options...",
  "Getting ready for liftoff...",
  "Just a moment more...",
];

interface LoaderProps {
  message?: string;
}

export const Loader: React.FC<LoaderProps> = ({ message }) => {
  const [displayMessage, setDisplayMessage] = useState(message || defaultMessages[0]);

  useEffect(() => {
    if (message) {
      setDisplayMessage(message);
    } else {
      const interval = setInterval(() => {
        setDisplayMessage(prev => {
          const currentIndex = defaultMessages.indexOf(prev);
          const nextIndex = (currentIndex + 1) % defaultMessages.length;
          return defaultMessages[nextIndex];
        });
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [message]);

  return (
    <div className="flex flex-col items-center justify-center p-10 text-center">
      <PencilLoaderIcon />
      <p className="mt-4 text-lg font-semibold text-slate-700 dark:text-slate-300 min-h-[28px]">
        {displayMessage}
      </p>
    </div>
  );
};
