import React from 'react';

interface WinScreenProps {
  capturedPercent: number;
  onNextLevel: () => void;
}

const WinScreen: React.FC<WinScreenProps> = ({ capturedPercent, onNextLevel }) => (
  <div
    className="absolute inset-0 flex flex-col items-center justify-center bg-emerald-900/80 z-50 rounded-lg"
    role="dialog"
    aria-labelledby="win-screen-title"
  >
    <h2
      id="win-screen-title"
      className="text-6xl font-black text-white mb-4 tracking-tighter italic"
    >
      LEVEL CLEAR!
    </h2>
    <p className="text-emerald-200 mb-6 text-xl">You captured {capturedPercent}% of the void!</p>
    <button
      onClick={onNextLevel}
      className="px-8 py-3 bg-white text-emerald-900 font-bold text-xl hover:bg-emerald-100 transition-colors rounded shadow-lg"
    >
      NEXT LEVEL
    </button>
  </div>
);

export default WinScreen;
