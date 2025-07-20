
import React, { useRef, useEffect, useState } from 'react';
import { SnakeIcon } from './icons/SnakeIcon';

interface SnakeGameModalProps {
  isOpen: boolean;
  onContinue: () => void;
}

const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 300;
const GRID_SIZE = 20;

export const SnakeGameModal: React.FC<SnakeGameModalProps> = ({ isOpen, onContinue }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  
  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;
    
    let snake = [{ x: 8 * GRID_SIZE, y: 8 * GRID_SIZE }];
    let food = { x: 0, y: 0 };
    let direction = { x: 1, y: 0 }; // Moving right initially
    let scoreCounter = 0;
    let gameLoopId: number;

    const spawnFood = () => {
        food.x = Math.floor(Math.random() * (CANVAS_WIDTH / GRID_SIZE)) * GRID_SIZE;
        food.y = Math.floor(Math.random() * (CANVAS_HEIGHT / GRID_SIZE)) * GRID_SIZE;
        // Ensure food doesn't spawn on the snake
        for (const part of snake) {
            if (part.x === food.x && part.y === food.y) {
                spawnFood();
                return;
            }
        }
    };
    
    spawnFood();
    setIsGameOver(false);
    setScore(0);

    const handleKeyDown = (e: KeyboardEvent) => {
        switch(e.code) {
            case 'ArrowUp':
            case 'KeyW':
                if (direction.y === 0) direction = { x: 0, y: -1 };
                break;
            case 'ArrowDown':
            case 'KeyS':
                if (direction.y === 0) direction = { x: 0, y: 1 };
                break;
            case 'ArrowLeft':
            case 'KeyA':
                if (direction.x === 0) direction = { x: -1, y: 0 };
                break;
            case 'ArrowRight':
            case 'KeyD':
                if (direction.x === 0) direction = { x: 1, y: 0 };
                break;
        }
    };

    document.addEventListener('keydown', handleKeyDown);

    function gameLoop() {
        const head = { x: snake[0].x + direction.x * GRID_SIZE, y: snake[0].y + direction.y * GRID_SIZE };

        // Wall collision
        if (head.x < 0 || head.x >= CANVAS_WIDTH || head.y < 0 || head.y >= CANVAS_HEIGHT) {
            setIsGameOver(true);
            return;
        }
        // Self collision
        for (let i = 1; i < snake.length; i++) {
            if (head.x === snake[i].x && head.y === snake[i].y) {
                setIsGameOver(true);
                return;
            }
        }
        
        snake.unshift(head);

        // Food collision
        if (head.x === food.x && head.y === food.y) {
            scoreCounter++;
            setScore(scoreCounter);
            spawnFood();
        } else {
            snake.pop();
        }

        // Drawing
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.fillStyle = '#fde047'; // Food color
        ctx.fillRect(food.x, food.y, GRID_SIZE, GRID_SIZE);

        ctx.fillStyle = '#34d399'; // Snake color
        snake.forEach(part => ctx.fillRect(part.x, part.y, GRID_SIZE, GRID_SIZE));
        
        gameLoopId = window.setTimeout(gameLoop, 100);
    }
    
    gameLoop();

    return () => {
        window.clearTimeout(gameLoopId);
        document.removeEventListener('keydown', handleKeyDown);
    };

  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in" aria-modal="true" role="dialog">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
            <SnakeIcon className="w-8 h-8 text-green-500"/>
            <h2 className="text-2xl font-bold text-slate-800">Pixel Python</h2>
        </div>
        <p className="text-slate-600 mb-2">Use <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">Arrow Keys</kbd> or <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">WASD</kbd> to move.</p>
        <div className="relative">
            <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="bg-slate-800 rounded-lg w-full"></canvas>
            <div className="absolute top-2 right-2 bg-slate-800/70 text-white text-lg font-bold px-3 py-1 rounded">
                Score: {score}
            </div>
             {isGameOver && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center rounded-lg">
                    <p className="text-white text-4xl font-bold">Game Over</p>
                    <p className="text-white text-xl">Your score: {score}</p>
                </div>
            )}
        </div>
        <button
          onClick={onContinue}
          className="mt-6 w-full max-w-xs inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-lg shadow-blue-500/30 text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          Continue Quiz
        </button>
      </div>
    </div>
  );
};
