
import React from 'react';

export const SnakeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    shapeRendering="crispEdges"
    {...props}
  >
    <path d="M10 16h1v1h1v1h2v-1h1v-1h1v-1h1v-3h-1v-1h-1V9h-1V8h-2v1H9v1H8v1H7v3h1v1h1v1h1zM11 6h2v1h-2z" />
  </svg>
);
