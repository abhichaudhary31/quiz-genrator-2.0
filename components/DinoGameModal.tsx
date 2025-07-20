import React, { useRef, useEffect, useState } from 'react';
import { DinoIcon } from './icons/DinoIcon';

interface DinoGameModalProps {
  isOpen: boolean;
  onContinue: () => void;
}

export const DinoGameModal: React.FC<DinoGameModalProps> = ({ isOpen, onContinue }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let player = { x: 50, y: 150, width: 20, height: 20, dy: 0, gravity: 0.4, jumpPower: -8, isGrounded: true };
    let obstacles: { x: number, width: number, height: number }[] = [];
    let gameSpeed = 3;
    let scoreCounter = 0;
    let frameId: number;
    let keys: { [key: string]: boolean } = {};

    const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.code === 'Space' || e.code === 'ArrowUp') && player.isGrounded) {
            player.dy = player.jumpPower;
            player.isGrounded = false;
        }
    };
    
    document.addEventListener('keydown', handleKeyDown);

    function spawnObstacle() {
        if (Math.random() < 0.02) { // Adjust spawn rate
            const height = Math.random() * 30 + 20;
            obstacles.push({ x: canvas.width, width: 20, height: height });
        }
    }

    function gameLoop() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Update and draw player
        player.dy += player.gravity;
        player.y += player.dy;

        if (player.y + player.height > canvas.height) {
            player.y = canvas.height - player.height;
            player.dy = 0;
            player.isGrounded = true;
        }
        
        ctx.fillStyle = '#333';
        ctx.fillRect(player.x, player.y, player.width, player.height);

        // Update, draw, and check obstacles
        for (let i = obstacles.length - 1; i >= 0; i--) {
            const o = obstacles[i];
            o.x -= gameSpeed;
            ctx.fillStyle = '#c00';
            ctx.fillRect(o.x, canvas.height - o.height, o.width, o.height);

            // Collision detection
            if (player.x < o.x + o.width &&
                player.x + player.width > o.x &&
                player.y < canvas.height &&
                player.y + player.height > canvas.height - o.height) {
                // Game Over
                cancelAnimationFrame(frameId);
                ctx.fillStyle = 'black';
                ctx.font = 'bold 30px sans-serif';
                ctx.fillText('Game Over', canvas.width / 2 - 80, canvas.height / 2);
                document.removeEventListener('keydown', handleKeyDown);
                return;
            }
            
            // Remove off-screen obstacles
            if (o.x + o.width < 0) {
                obstacles.splice(i, 1);
            }
        }
        
        spawnObstacle();

        scoreCounter++;
        if(scoreCounter % 5 === 0) {
            setScore(Math.floor(scoreCounter / 5));
        }
        if(scoreCounter % 500 === 0) {
            gameSpeed += 0.5; // Increase difficulty
        }

        frameId = requestAnimationFrame(gameLoop);
    }
    
    gameLoop();

    return () => {
        cancelAnimationFrame(frameId);
        document.removeEventListener('keydown', handleKeyDown);
    };

  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in" aria-modal="true" role="dialog">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
            <DinoIcon className="w-8 h-8 text-slate-700"/>
            <h2 className="text-2xl font-bold text-slate-800">Game Break!</h2>
        </div>
        <p className="text-slate-600 mb-2">Take a quick break. Press <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">Space</kbd> or <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">↑</kbd> to jump!</p>
        <div className="relative">
            <canvas ref={canvasRef} width="500" height="200" className="bg-slate-100 rounded-lg w-full"></canvas>
            <div className="absolute top-2 right-2 bg-slate-800/70 text-white text-lg font-bold px-3 py-1 rounded">
                Score: {score}
            </div>
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
