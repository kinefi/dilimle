import React from 'react';
import { ErrorBoundary as ReactErrorBoundary, FallbackProps } from 'react-error-boundary';

const ErrorFallback: React.FC<FallbackProps> = ({ error, resetErrorBoundary }) => (
  <div className="p-8 bg-red-900/20 border-2 border-red-500 rounded-lg text-white max-w-lg">
    <h1 className="text-2xl font-bold mb-2 italic tracking-tighter">ENGINE ERROR</h1>
    <p className="text-red-200 mb-4">{error?.message}</p>
    <button
      onClick={resetErrorBoundary}
      className="px-4 py-2 bg-red-600 rounded font-bold transition-colors hover:bg-red-500"
    >
      REBOOT SYSTEM
    </button>
  </div>
);

interface Props {
  children: React.ReactNode;
}

export const ErrorBoundary: React.FC<Props> = ({ children }) => {
  return (
    <ReactErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => window.location.reload()}
    >
      {children}
    </ReactErrorBoundary>
  );
};