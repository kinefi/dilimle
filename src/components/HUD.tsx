import React from 'react';

interface HUDProps {
  level: number;
  capturedPercent: number;
  lives: number;
  shieldTime: number;
  slowMotionTime: number;
  score: number;
}

const HUD: React.FC<HUDProps> = ({ level, capturedPercent, lives, shieldTime, slowMotionTime, score }) => {
  return (
    <div className="absolute top-4 left-4 right-4 flex flex-col gap-2 pointer-events-none text-white font-mono text-xl drop-shadow-md">
      <div className="flex justify-between items-center">
        <div className="flex gap-4">
          <div className="bg-slate-800/50 px-4 py-2 rounded-lg border border-slate-600">
            SCORE: <span className="text-yellow-400">{score.toLocaleString()}</span>
          </div>
          <div className="bg-slate-800/50 px-4 py-2 rounded-lg border border-slate-600">
            AREA: <span className="text-emerald-400">{capturedPercent}%</span>
          </div>
        </div>
        <div className="bg-slate-800/50 px-4 py-2 rounded-lg border border-slate-600">
          LIVES: <span className="text-red-400">{"❤️".repeat(lives)}</span>
        </div>
      </div>
      {shieldTime > 0 && (
        <div className="self-center bg-sky-900/50 px-4 py-1 rounded border border-sky-400 text-sm">
          SHIELD ACTIVE: {Math.ceil(shieldTime / 60)}s
        </div>
      )}
      {slowMotionTime > 0 && (
        <div className="self-center bg-cyan-900/50 px-4 py-1 rounded border border-cyan-400 text-sm animate-pulse">
          SLOW MOTION: {Math.ceil(slowMotionTime / 60)}s
        </div>
      )}
    </div>
  );
};

export default HUD;