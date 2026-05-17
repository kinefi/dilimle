import React, { useRef, use, useState } from 'react';
import { GAME_CONFIG } from '../constants/config';
import HUD from './HUD';
import GameOver from './GameOver';
import BossHealthBar from './BossHealthBar';
import WinScreen from './WinScreen';
import StartScreen from './StartScreen';
import { useGameEngine } from '../hooks/useGameEngine';
import { assetsPromise, audioCtx } from '../utils/audioUtils';

const GameCanvas: React.FC = () => {
  const audioAssets = use(assetsPromise);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStarted, setIsStarted] = useState(false);
  const { 
    level, 
    score, 
    lives, 
    capturedPercent, 
    bossHealth, 
    isGameOver, 
    isWin, 
    shieldTime, 
    slowMotionTime, 
    resetGame,
    bgmVolume,
    setBgmVolume
  } = useGameEngine(canvasRef, audioAssets, isStarted);

  const handleStart = () => {
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    setIsStarted(true);
  };

  return (
    <div 
      className="relative outline-none" 
      onMouseDown={(e) => e.currentTarget.focus()}
      tabIndex={0}
    >
      <HUD level={level} score={score} capturedPercent={capturedPercent} lives={lives} shieldTime={shieldTime} slowMotionTime={slowMotionTime} />

      <div className="absolute bottom-4 left-4 z-50 px-4 py-2 bg-slate-800/60 backdrop-blur-md rounded-lg border border-slate-700/50 text-white font-black tracking-widest pointer-events-none shadow-lg">
        <span className="text-xs text-slate-400 block uppercase font-bold">Current</span>
        LEVEL {level}
      </div>

      <div className="absolute bottom-4 right-4 z-50 flex items-center gap-3 p-3 bg-slate-800/60 backdrop-blur-md rounded-full shadow-lg border border-slate-700/50 group transition-all hover:pr-5">
        <span className="text-xl leading-none text-white transition-transform group-hover:scale-110">
          {bgmVolume === 0 ? '🔇' : bgmVolume < 0.5 ? '🔉' : '🔊'}
        </span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={bgmVolume}
          onChange={(e) => setBgmVolume(parseFloat(e.target.value))}
          className="w-0 overflow-hidden transition-all duration-300 group-hover:w-24 accent-emerald-500 cursor-pointer h-1.5 rounded-lg appearance-none bg-slate-600"
          title="Background Music Volume"
        />
      </div>
      
      {isStarted && !isGameOver && !isWin && <BossHealthBar health={bossHealth} />}

      {isGameOver && <GameOver onRestart={resetGame} />}
      
      {isWin && <WinScreen capturedPercent={capturedPercent} onNextLevel={resetGame} />}

      {!isStarted && !isGameOver && <StartScreen onStart={handleStart} />}

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