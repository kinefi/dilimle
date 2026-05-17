import { useRef, useEffect } from 'react';

export const useInputHandler = (isStarted: boolean, isPaused: boolean) => {
  const keysRef = useRef<Record<string, boolean>>({});
  const keyStackRef = useRef<string[]>([]);

  useEffect(() => {
    if (!isStarted || isPaused) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
      if (!keysRef.current[e.key]) {
        keysRef.current[e.key] = true;
        if (e.key.startsWith('Arrow')) {
          keyStackRef.current.push(e.key);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key] = false;
      if (e.key.startsWith('Arrow')) {
        keyStackRef.current = keyStackRef.current.filter(k => k !== e.key);
      }
    };

    const handleBlur = () => {
      keysRef.current = {};
      keyStackRef.current = [];
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [isStarted, isPaused]);

  return {
    keys: keysRef.current,
    keyStack: keyStackRef,
    resetInput: () => {
      keysRef.current = {};
      keyStackRef.current = [];
    }
  };
};