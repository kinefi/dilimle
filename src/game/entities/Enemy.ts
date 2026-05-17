import { GAME_CONFIG } from '../../constants/config';
import type { Point } from '../../utils/geometryUtils';
import { isPointInPolygon } from '../../utils/geometryUtils';

export enum EnemyType {
  BOUNCER,
  CHASER,
  FIRE_TRAILER,
}

interface FirePoint extends Point {
  createdAt: number;
}

export class Enemy {
  public x: number;
  public y: number;
  public fireTrail: FirePoint[] = [];
  private vx: number;
  private vy: number;
  private radius = 8;
  private type: EnemyType;
  private lastTrailDrop = 0;

  constructor(x: number, y: number, type: EnemyType = EnemyType.BOUNCER, speedScale = 1) {
    this.x = x;
    this.y = y;
    this.type = type;
    const speed = (type === EnemyType.CHASER ? 4 : 5) * speedScale;
    this.vx = (Math.random() - 0.5) * speed;
    this.vy = (Math.random() - 0.5) * speed;
  }

  /**
   * Helper to check if the enemy's center is inside a given polygon
   */
  isInsidePolygon(polygon: Point[]): boolean {
    // Expanded sampling points for airtight detection
    const checkPoints = [
      { x: this.x, y: this.y },
      { x: this.x - this.radius, y: this.y },
      { x: this.x + this.radius, y: this.y },
      { x: this.x, y: this.y - this.radius },
      { x: this.x, y: this.y + this.radius },
      { x: this.x - this.radius * 0.5, y: this.y - this.radius * 0.5 },
      { x: this.x + this.radius * 0.5, y: this.y + this.radius * 0.5 },
      { x: this.x - this.radius * 0.5, y: this.y + this.radius * 0.5 },
      { x: this.x + this.radius * 0.5, y: this.y - this.radius * 0.5 },
    ];
    return checkPoints.some((p) => isPointInPolygon(p, polygon));
  }

  update(isSafeCheck: (p: Point) => boolean, playerPos?: Point, slowFactor = 1) {
    const effectiveVx = this.vx * slowFactor;
    const effectiveVy = this.vy * slowFactor;

    if (this.type === EnemyType.CHASER && playerPos) {
      const dx = playerPos.x - this.x;
      const dy = playerPos.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0) {
        this.vx += (dx / dist) * 0.05 * slowFactor;
        this.vy += (dy / dist) * 0.05 * slowFactor;
      }

      const speedLimit = 2.5;
      const currentSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      if (currentSpeed > speedLimit) {
        this.vx = (this.vx / currentSpeed) * speedLimit;
        this.vy = (this.vy / currentSpeed) * speedLimit;
      }
    }

    if (this.type === EnemyType.FIRE_TRAILER) {
      const now = Date.now();
      if (now - this.lastTrailDrop > 150) {
        this.fireTrail.push({ x: this.x, y: this.y, createdAt: now });
        this.lastTrailDrop = now;
      }
      this.fireTrail = this.fireTrail.filter((p) => now - p.createdAt < 4000);
    }

    // Check collision slightly ahead of current velocity to prevent getting stuck
    const checkBuffer = this.radius + 2;
    const checkX = this.x + (effectiveVx > 0 ? checkBuffer : -checkBuffer);
    const checkY = this.y + (effectiveVy > 0 ? checkBuffer : -checkBuffer);

    const horizontalCollision =
      isSafeCheck({ x: checkX, y: this.y }) ||
      checkX < this.radius ||
      checkX > GAME_CONFIG.GRID_WIDTH - this.radius;
    const verticalCollision =
      isSafeCheck({ x: this.x, y: checkY }) ||
      checkY < this.radius ||
      checkY > GAME_CONFIG.GRID_HEIGHT - this.radius;

    if (horizontalCollision) {
      this.vx *= -1;
    }
    if (verticalCollision) {
      this.vy *= -1;
    }

    this.x += effectiveVx;
    this.y += effectiveVy;
  }

  draw(ctx: CanvasRenderingContext2D, isSlow = false) {
    if (this.type === EnemyType.FIRE_TRAILER) {
      ctx.save();
      this.fireTrail.forEach((p, i) => {
        const alpha = (i / this.fireTrail.length) * 0.6;
        ctx.fillStyle = `rgba(255, 87, 34, ${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }
    ctx.fillStyle = isSlow ? '#00e5ff' : GAME_CONFIG.COLORS.ENEMY;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}
