import React from 'react';

interface StartScreenProps {
  onStart: () => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => (
  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-40 rounded-lg backdrop-blur-sm">
    <button 
      onClick={onStart}
      className="px-12 py-4 bg-emerald-500 text-white font-black text-2xl hover:bg-emerald-400 transition-all transform hover:scale-105 rounded shadow-xl tracking-widest"
    >
      START GAME
    </button>
    <p className="text-slate-300 mt-4 font-mono text-sm uppercase">Use Arrow Keys to Slice</p>
  </div>
);

export default StartScreen;