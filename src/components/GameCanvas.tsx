import React, { useRef, use, useState } from 'react';
import { GAME_CONFIG } from '../constants/config';
import HUD from './HUD';
import GameOver from './GameOver';
import { useGameEngine } from '../hooks/useGameEngine';
import { assetsPromise, audioCtx } from '../utils/gameHelpers';

const GameCanvas: React.FC = () => {
  const audioAssets = use(assetsPromise);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStarted, setIsStarted] = useState(false);
  const { level, score, lives, capturedPercent, bossHealth, isGameOver, isWin, shieldTime, slowMotionTime, resetGame } = useGameEngine(canvasRef, audioAssets, isStarted);

  const handleStart = () => {
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    setIsStarted(true);
  };

  return (
    <div className="relative outline-none" onKeyDown={(e) => isStarted && e.preventDefault()} tabIndex={0}>
      <HUD level={level} score={score} capturedPercent={capturedPercent} lives={lives} shieldTime={shieldTime} slowMotionTime={slowMotionTime} />
      
      {isStarted && !isGameOver && !isWin && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-64 h-4 bg-slate-800 rounded-full border border-slate-600 overflow-hidden z-30">
          <div 
            className="h-full bg-red-500 transition-all duration-300" 
            style={{ width: `${bossHealth}%` }}
          />
          <span className="absolute inset-0 flex items-center justify-center text-[10px] text-white font-bold uppercase">Boss Integrity</span>
        </div>
      )}

      {isGameOver && <GameOver onRestart={resetGame} />}
      
      {isWin && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-emerald-900/80 z-50 rounded-lg">
          <h2 className="text-6xl font-black text-white mb-4 tracking-tighter italic">LEVEL CLEAR!</h2>
          <p className="text-emerald-200 mb-6 text-xl">You captured {capturedPercent}% of the void!</p>
          <button 
            onClick={resetGame}
            className="px-8 py-3 bg-white text-emerald-900 font-bold text-xl hover:bg-emerald-100 transition-colors rounded shadow-lg"
          >
            NEXT LEVEL
          </button>
        </div>
      )}

      {!isStarted && !isGameOver && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-40 rounded-lg backdrop-blur-sm">
          <button 
            onClick={handleStart}
            className="px-12 py-4 bg-emerald-500 text-white font-black text-2xl hover:bg-emerald-400 transition-all transform hover:scale-105 rounded shadow-xl tracking-widest"
          >
            START GAME
          </button>
          <p className="text-slate-300 mt-4 font-mono text-sm uppercase">Use Arrow Keys to Slice</p>
        </div>
      )}

      <canvas 
        ref={canvasRef} 
        width={GAME_CONFIG.GRID_WIDTH} 
        height={GAME_CONFIG.GRID_HEIGHT} 
        className="border-2 border-slate-700 shadow-2xl rounded-lg" 
      />
    </div>
  );
};

export default GameCanvas;