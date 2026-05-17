import React from 'react';

interface GameOverProps {
  onRestart: () => void;
}

const GameOver: React.FC<GameOverProps> = ({ onRestart }) => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-50 rounded-lg">
      <h2 className="text-6xl font-black text-red-500 mb-4 tracking-tighter italic">GAME OVER</h2>
      <button
        onClick={onRestart}
        className="px-8 py-3 bg-white text-black font-bold text-xl hover:bg-emerald-400 transition-colors rounded"
      >
        TRY AGAIN
      </button>
    </div>
  );
};

export default GameOver;
