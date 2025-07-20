
import React from 'react';

export const PencilLoaderIcon: React.FC = () => (
  <svg width="100" height="100" viewBox="0 0 200 200">
    <defs>
      <linearGradient id="pencil-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style={{ stopColor: '#3b82f6' }} /> 
        <stop offset="100%" style={{ stopColor: '#22c55e' }} />
      </linearGradient>
    </defs>
    <path
      id="pencil-path"
      stroke="url(#pencil-gradient)"
      strokeWidth="8"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      d="M50 150 l25 -25 l50 -50 l25 25 l-50 50 l-25 25 l-25 -25 v-50 h50"
    />
    <circle cx="50" cy="150" r="10" fill="#22c55e" />
    <circle cx="150" cy="100" r="10" fill="#3b82f6" />
  </svg>
);
