import { Point, distToSegment } from './geometryUtils';
import { Enemy } from '../game/entities/Enemy';

export const checkEnemiesTrailCollision = (
  enemies: Enemy[], 
  trail: Point[], 
  shieldActive: boolean
): boolean => {
  if (shieldActive) return false;
  
  for (const enemy of enemies) {
    for (let i = 0; i < trail.length - 1; i++) {
      if (distToSegment({ x: enemy.x, y: enemy.y }, trail[i], trail[i + 1]) < 10) {
        return true;
      }
    }
  }
  return false;
};

export const checkPlayerSelfCollision = (
  player: Point, 
  trail: Point[], 
  shieldActive: boolean
): boolean => {
  if (shieldActive || trail.length < 15) return false;
  
  for (let i = 0; i < trail.length - 15; i++) {
    if (distToSegment(player, trail[i], trail[i + 1]) < 5) return true;
  }
  return false;
};

export const checkFireTrailCollision = (
  player: Point, 
  enemies: Enemy[], 
  fireShieldActive: boolean,
  generalShieldActive: boolean
): boolean => {
  if (fireShieldActive || generalShieldActive) return false;
  
  for (const enemy of enemies) {
    for (const fire of enemy.fireTrail) {
      const distSq = Math.pow(player.x - fire.x, 2) + Math.pow(player.y - fire.y, 2);
      if (distSq < 64) return true; // 8px radius
    }
  }
  return false;
};