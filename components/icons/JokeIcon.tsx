import React from 'react';

export const JokeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        {...props}
    >
        <path stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18Z" fill="none"/>
        <path d="M12 15.5c-2 0-3-1-4.5-1.5s-2.5 1-2.5 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <path d="M19 15s-1-2.5-2.5-2.5-3 2.5-4.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <path d="M8.5 9.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"/>
        <path d="M15.5 9.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"/>
    </svg>
);