import React, { Suspense } from 'react';
import GameCanvas from './components/GameCanvas';
import { ErrorBoundary } from './components/ErrorBoundary';

const App: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <header className="mb-8 text-center">
        <h1 className="text-5xl font-black text-white tracking-tighter italic">DİLİMLE</h1>
      </header>

      <ErrorBoundary>
        <Suspense
          fallback={<div className="text-white font-mono animate-pulse">BOOTING ENGINE...</div>}
        >
          <GameCanvas />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
};

export default App;
