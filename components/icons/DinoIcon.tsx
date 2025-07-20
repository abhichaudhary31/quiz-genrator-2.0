import React from 'react';

export const DinoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="currentColor"
    shapeRendering="crispEdges"
    {...props}
  >
    <path d="M5 5h3v1h1v1h2v1h1v5h-1v1h-1v1h-1v1h-2v-1H6v-1H5V5zm12 2h1v1h1v6h-1v1h-1v1h-1v-1h-1v-1h-1v-2h1v-1h1v-1h1V7z" />
    <path d="M9 16h1v1h3v-1h1v-1h1v5H9v-5z" />
  </svg>
);