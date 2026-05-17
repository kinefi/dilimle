import { GAME_CONFIG } from '../constants/config';
import { Enemy, EnemyType } from '../game/entities/Enemy';
import type { Point } from './geometryUtils';

export const getLevelConfig = (level: number) => {
  const targetPercent = Math.min(75 + level * 2, 95);
  const enemyCount = level + 1;
  return { targetPercent, enemyCount };
};

export const getEnemyTypeForLevel = (level: number, index: number): EnemyType => {
  // Difficulty spike after level 10: Upgrade Bouncers to Chasers
  if (level > 10 && index % 3 === 0) return EnemyType.CHASER;

  // Standard Gating
  if (level >= 3 && index % 3 === 2) return EnemyType.FIRE_TRAILER;
  if (level >= 2 && index % 3 === 1) return EnemyType.CHASER;

  return EnemyType.BOUNCER;
};

export const getEnemySpeedScale = (level: number): number => {
  let speedScale = 1 + (level - 1) * 0.1;
  if (level > 10) speedScale *= 1.3;
  return speedScale;
};

export const calculateScoreMultiplier = (delta: number): number => {
  return 1 + Math.floor(delta / 10);
};

export const calculateCapturedPercentage = (currentArea: number, initialArea: number): number => {
  const totalArea = GAME_CONFIG.GRID_WIDTH * GAME_CONFIG.GRID_HEIGHT;
  const playableArea = Math.max(1, totalArea - initialArea);
  if (playableArea <= 0) return 0;

  const capturedFromVoid = Math.max(0, currentArea - initialArea);
  return Math.min(100, Math.floor((capturedFromVoid / playableArea) * 100));
};

export const createLevelEnemies = (level: number): Enemy[] => {
  const { enemyCount } = getLevelConfig(level);
  const speedScale = getEnemySpeedScale(level);
  const enemies: Enemy[] = [];
  for (let i = 0; i < enemyCount; i++) {
    const type = getEnemyTypeForLevel(level, i);
    enemies.push(new Enemy(200 + i * 50, 200, type, speedScale));
  }
  return enemies;
};

export const calculateBossHealth = (targetPercent: number, capturedPercent: number): number => {
  return Math.max(0, Math.floor(((targetPercent - capturedPercent) / targetPercent) * 100));
};

export const getInitialCapturedPolygons = (): Point[][] => [
  [
    { x: 0, y: 0 },
    { x: GAME_CONFIG.GRID_WIDTH, y: 0 },
    { x: GAME_CONFIG.GRID_WIDTH, y: 20 },
    { x: 0, y: 20 },
  ],
  [
    { x: GAME_CONFIG.GRID_WIDTH - 20, y: 0 },
    { x: GAME_CONFIG.GRID_WIDTH, y: 0 },
    { x: GAME_CONFIG.GRID_WIDTH, y: GAME_CONFIG.GRID_HEIGHT },
    { x: GAME_CONFIG.GRID_WIDTH - 20, y: GAME_CONFIG.GRID_HEIGHT },
  ],
  [
    { x: 0, y: GAME_CONFIG.GRID_HEIGHT - 20 },
    { x: GAME_CONFIG.GRID_WIDTH, y: GAME_CONFIG.GRID_HEIGHT - 20 },
    { x: GAME_CONFIG.GRID_WIDTH, y: GAME_CONFIG.GRID_HEIGHT },
    { x: 0, y: GAME_CONFIG.GRID_HEIGHT },
  ],
  [
    { x: 0, y: 0 },
    { x: 20, y: 0 },
    { x: 20, y: GAME_CONFIG.GRID_HEIGHT },
    { x: 0, y: GAME_CONFIG.GRID_HEIGHT },
  ],
];
