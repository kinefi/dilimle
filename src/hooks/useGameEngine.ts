import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { GameLoop } from '../game/engine/GameLoop';
import { Renderer } from '../game/engine/Renderer';
import { GAME_CONFIG } from '../constants/config';
import { Enemy, EnemyType } from '../game/entities/Enemy';
import { Spark } from '../game/entities/Spark';
import { Shield, ShieldType } from '../game/entities/Shield';
import { performCaptureCalculation, calculateTotalArea } from '../utils/gameHelpers';
import type { Point } from '../utils/geometryUtils';
import { isPointInPolygon } from '../utils/geometryUtils';
import {
  checkEnemiesTrailCollision,
  checkPlayerSelfCollision,
  checkFireTrailCollision,
} from '../utils/collisionUtils';
import {
  getLevelConfig,
  calculateScoreMultiplier,
  calculateCapturedPercentage,
  createLevelEnemies,
  calculateBossHealth,
  getInitialCapturedPolygons,
} from '../utils/progressionUtils';
import { playSound, startBGM, stopBGM, setBGMVolume, type AudioAssets } from '../utils/audioUtils';
import { useInputHandler } from './useInputHandler';
import { usePowerUps } from './usePowerUps';
import polygonClipping from 'polygon-clipping';

export const useGameEngine = (
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  audioAssets: AudioAssets,
  isStarted: boolean,
) => {
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(GAME_CONFIG.INITIAL_LIVES);
  const [capturedPercent, setCapturedPercent] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isWin, setIsWin] = useState(false);
  const levelRef = useRef(1);
  const initialAreaRef = useRef(0);
  const capturedPercentRef = useRef(0);

  const {
    shieldTime,
    shieldTimeRef,
    fireShieldTime,
    fireShieldTimeRef,
    slowMotionTime,
    slowMotionTimeRef,
    updateTimers,
    resetPowerUps,
    setShieldTime,
    setFireShieldTime,
    setSlowMotionTime,
  } = usePowerUps();

  const [bgmVolume, setBgmVolume] = useState(0.5);

  const playerRef = useRef({ x: 0, y: 0 });
  const { keyStack, resetInput } = useInputHandler(isStarted, isGameOver || isWin);

  const enemiesRef = useRef([
    new Enemy(200, 200, EnemyType.BOUNCER),
    new Enemy(GAME_CONFIG.GRID_WIDTH - 200, GAME_CONFIG.GRID_HEIGHT - 200, EnemyType.CHASER),
  ]);
  const sparkRef = useRef(new Spark());
  const shieldRef = useRef(new Shield());

  const sliceState = useRef({
    isSlicing: false,
    trail: [] as Point[],
    capturedPolygons: getInitialCapturedPolygons(),
  });

  // Setup timers and assets
  useEffect(() => {
    if (!isStarted) return;

    // Spawn a shield randomly every 15-30 seconds
    const shieldTimer = setInterval(() => {
      if (!sliceState.current.isSlicing && !isGameOver && !isWin) {
        const fullField: [number, number][][] = [
          [
            [0, 0],
            [GAME_CONFIG.GRID_WIDTH, 0],
            [GAME_CONFIG.GRID_WIDTH, GAME_CONFIG.GRID_HEIGHT],
            [0, GAME_CONFIG.GRID_HEIGHT],
          ],
        ];
        const currentCaptured = sliceState.current.capturedPolygons.map((p) => [
          p.map((pt) => [pt.x, pt.y] as [number, number]),
        ]);
        const currentVoid = polygonClipping.difference(fullField, currentCaptured);

        const voidPolys: Point[][] = currentVoid.map((mp) => mp[0].map(([x, y]) => ({ x, y })));

        const rand = Math.random();
        const type =
          rand > 0.66 ? ShieldType.SLOW_MOTION : rand > 0.33 ? ShieldType.FIRE : ShieldType.NORMAL;

        shieldRef.current.spawn(voidPolys, type);
      }
    }, 15000);

    return () => clearInterval(shieldTimer);
  }, [isStarted, isGameOver, isWin]);

  const resetGame = () => {
    // Determine if we are advancing or restarting
    const isNextLevel = isWin;
    const nextLevel = isNextLevel ? level + 1 : 1;
    levelRef.current = nextLevel;

    if (!isNextLevel) {
      setLives(GAME_CONFIG.INITIAL_LIVES);
      setScore(0);
    }

    setLevel(nextLevel);

    initialAreaRef.current = capturedPercentRef.current = 0;
    setCapturedPercent(0);
    setIsGameOver(false);
    setIsWin(false);
    resetPowerUps();
    playerRef.current = { x: 0, y: 0 };
    resetInput();

    enemiesRef.current = createLevelEnemies(nextLevel);

    sparkRef.current = new Spark();
    sliceState.current.isSlicing = false;
    sliceState.current.trail = [];
    sliceState.current.capturedPolygons = getInitialCapturedPolygons();

    const area = calculateTotalArea(sliceState.current.capturedPolygons);
    initialAreaRef.current = area;
    capturedPercentRef.current = 0;
    setCapturedPercent(0);
  };

  useEffect(() => {
    setBGMVolume(bgmVolume);
  }, [bgmVolume]);

  // Separate Effect for BGM management to handle muting and game states independently
  useEffect(() => {
    // Only start if the game is active and not muted
    if (isStarted && !isGameOver && !isWin && bgmVolume > 0 && audioAssets?.bgm) {
      startBGM(audioAssets.bgm);
    } else {
      stopBGM();
    }
  }, [isStarted, isGameOver, isWin, bgmVolume, audioAssets]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !audioAssets || isGameOver || isWin || !isStarted) return;

    // Ensure initial area is calculated before the first frame
    if (initialAreaRef.current === 0) {
      const area = calculateTotalArea(sliceState.current.capturedPolygons);
      initialAreaRef.current = area;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Ensure the canvas container is focused for input
    canvasRef.current?.parentElement?.focus();

    const update = (): void => {
      const player = playerRef.current;
      const state = sliceState.current;

      const handleDeath = () => {
        setLives((prev) => {
          if (prev <= 1) {
            setIsGameOver(true);
            playSound(audioAssets.capture, 1, 0);
          }
          return prev - 1;
        });
        state.isSlicing = false;
        state.trail = [];
        sparkRef.current.isActive = false;
        // Reset player to origin safe zone on death to prevent instant re-death
        playerRef.current = { x: 0, y: 0 };
      };

      const handleMovement = () => {
        const radius = 5;
        const currentMoveKey = keyStack.current[keyStack.current.length - 1];

        if (currentMoveKey === 'ArrowUp') {
          player.y = Math.max(radius, player.y - GAME_CONFIG.PLAYER_SPEED);
        } else if (currentMoveKey === 'ArrowDown') {
          player.y = Math.min(
            GAME_CONFIG.GRID_HEIGHT - radius,
            player.y + GAME_CONFIG.PLAYER_SPEED,
          );
        } else if (currentMoveKey === 'ArrowLeft') {
          player.x = Math.max(radius, player.x - GAME_CONFIG.PLAYER_SPEED);
        } else if (currentMoveKey === 'ArrowRight') {
          player.x = Math.min(GAME_CONFIG.GRID_WIDTH - radius, player.x + GAME_CONFIG.PLAYER_SPEED);
        }
      };

      const handleCapture = () => {
        if (state.trail.length < 2) {
          state.isSlicing = false;
          state.trail = [];
          return;
        }

        const result = performCaptureCalculation(
          state.trail,
          player,
          state.capturedPolygons,
          enemiesRef.current,
        );

        if (!result) return;
        if (result.shouldDie) {
          handleDeath();
          return;
        }

        state.capturedPolygons = result.finalCaptured;

        const currentArea = result.capturedPercent;
        const newPercent = calculateCapturedPercentage(currentArea, initialAreaRef.current);

        const delta = newPercent - capturedPercentRef.current;
        if (delta > 0) {
          const multiplier = calculateScoreMultiplier(delta);
          setScore((prev) => prev + delta * 100 * multiplier);
        }

        capturedPercentRef.current = newPercent;
        setCapturedPercent(newPercent);

        const { targetPercent } = getLevelConfig(levelRef.current);
        if (newPercent >= targetPercent) {
          setIsWin(true);
        }
        playSound(audioAssets.capture, 3, 5);

        state.isSlicing = false;
        state.trail = [];
        sparkRef.current.isActive = false;
      };

      const handleShields = () => {
        if (shieldRef.current.isActive) {
          const dist = Math.sqrt(
            Math.pow(player.x - shieldRef.current.x, 2) +
              Math.pow(player.y - shieldRef.current.y, 2),
          );
          if (dist < 20) {
            if (shieldRef.current.type === ShieldType.FIRE) {
              fireShieldTimeRef.current = GAME_CONFIG.SHIELD_DURATION;
              setFireShieldTime(GAME_CONFIG.SHIELD_DURATION);
            } else if (shieldRef.current.type === ShieldType.SLOW_MOTION) {
              slowMotionTimeRef.current = GAME_CONFIG.SHIELD_DURATION;
              setSlowMotionTime(GAME_CONFIG.SHIELD_DURATION);
            } else {
              shieldTimeRef.current = GAME_CONFIG.SHIELD_DURATION;
              setShieldTime(GAME_CONFIG.SHIELD_DURATION);
            }
            shieldRef.current.isActive = false;
          }
        }
      };

      handleMovement();
      handleShields();

      const inSafeZone = state.capturedPolygons.some((poly) => isPointInPolygon(player, poly));
      if (!inSafeZone && !state.isSlicing) {
        state.isSlicing = true;
        state.trail = [{ x: player.x, y: player.y }];
        sparkRef.current.activate(state.trail[0]);
      } else if (state.isSlicing) {
        const lastPoint = state.trail[state.trail.length - 1];
        if (Math.abs(lastPoint.x - player.x) > 2 || Math.abs(lastPoint.y - player.y) > 2) {
          state.trail.push({ x: player.x, y: player.y });
        }

        const shieldActive = shieldTimeRef.current > 0;
        const fireShieldActive = fireShieldTimeRef.current > 0;

        if (checkEnemiesTrailCollision(enemiesRef.current, state.trail, shieldActive))
          return handleDeath();
        if (checkPlayerSelfCollision(player, state.trail, shieldActive)) return handleDeath();
        if (checkFireTrailCollision(player, enemiesRef.current, fireShieldActive, shieldActive))
          return handleDeath();

        if (inSafeZone) handleCapture();
      }

      if (state.isSlicing) {
        if (sparkRef.current.update(state.trail, player)) {
          if (shieldTimeRef.current <= 0) {
            handleDeath();
          }
        }
      }

      updateTimers();

      enemiesRef.current.forEach((enemy) => {
        enemy.update(
          (p) => state.capturedPolygons.some((poly) => isPointInPolygon(p, poly)),
          playerRef.current,
          slowMotionTimeRef.current > 0 ? 0.3 : 1,
        );
      });
    };

    const renderer = new Renderer(ctx);
    const draw = (): void => {
      renderer.draw(
        sliceState.current.capturedPolygons,
        sliceState.current.trail,
        sliceState.current.isSlicing,
        playerRef.current,
        shieldTimeRef.current,
        fireShieldTimeRef.current,
        slowMotionTimeRef.current,
        enemiesRef.current,
        sparkRef.current,
        shieldRef.current,
      );
    };

    const engine = new GameLoop(update, draw);
    engine.start();
    return () => {
      engine.stop();
    };
  }, [
    audioAssets,
    isGameOver,
    isWin,
    isStarted,
    level,
    canvasRef,
    fireShieldTimeRef,
    keyStack,
    setFireShieldTime,
    setShieldTime,
    setSlowMotionTime,
    shieldTimeRef,
    slowMotionTimeRef,
    updateTimers,
    resetInput,
  ]);

  const { targetPercent } = getLevelConfig(level);
  const bossHealth = calculateBossHealth(targetPercent, capturedPercent);

  return {
    level,
    score,
    lives,
    capturedPercent,
    bossHealth,
    isGameOver,
    isWin,
    shieldTime,
    fireShieldTime,
    slowMotionTime,
    resetGame,
    bgmVolume,
    setBgmVolume,
  };
};
