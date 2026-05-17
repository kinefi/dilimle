import { useState, useRef } from 'react';
import { GAME_CONFIG } from '../constants/config';

export const usePowerUps = () => {
  const [shieldTime, setShieldTime] = useState(0);
  const shieldTimeRef = useRef(0);
  const [fireShieldTime, setFireShieldTime] = useState(0);
  const fireShieldTimeRef = useRef(0);
  const [slowMotionTime, setSlowMotionTime] = useState(0);
  const slowMotionTimeRef = useRef(0);

  const updateTimers = () => {
    if (shieldTimeRef.current > 0) {
      shieldTimeRef.current--;
      if (shieldTimeRef.current % 10 === 0) setShieldTime(shieldTimeRef.current);
    }
    if (fireShieldTimeRef.current > 0) {
      fireShieldTimeRef.current--;
      if (fireShieldTimeRef.current % 10 === 0) setFireShieldTime(fireShieldTimeRef.current);
    }
    if (slowMotionTimeRef.current > 0) {
      slowMotionTimeRef.current--;
      if (slowMotionTimeRef.current % 10 === 0) setSlowMotionTime(slowMotionTimeRef.current);
    }
  };

  const resetPowerUps = () => {
    setShieldTime(0);
    shieldTimeRef.current = 0;
    setFireShieldTime(0);
    fireShieldTimeRef.current = 0;
    setSlowMotionTime(0);
    slowMotionTimeRef.current = 0;
  };

  return {
    shieldTime,
    shieldTimeRef,
    fireShieldTime,
    fireShieldTimeRef,
    slowMotionTime,
    slowMotionTimeRef,
    setShieldTime: (val: number) => { shieldTimeRef.current = val; setShieldTime(val); },
    setFireShieldTime: (val: number) => { fireShieldTimeRef.current = val; setFireShieldTime(val); },
    setSlowMotionTime: (val: number) => { slowMotionTimeRef.current = val; setSlowMotionTime(val); },
    updateTimers,
    resetPowerUps
  };
};