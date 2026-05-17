import React from 'react';

interface BossHealthBarProps {
  health: number;
}

const BossHealthBar: React.FC<BossHealthBarProps> = ({ health }) => (
  <div className="absolute top-20 left-1/2 -translate-x-1/2 w-64 h-4 bg-slate-800 rounded-full border border-slate-600 overflow-hidden z-30">
    <div 
      className="h-full bg-red-500 transition-all duration-300" 
      style={{ width: `${health}%` }}
    />
    <span className="absolute inset-0 flex items-center justify-center text-[10px] text-white font-bold uppercase">Boss Integrity</span>
  </div>
);

export default BossHealthBar;