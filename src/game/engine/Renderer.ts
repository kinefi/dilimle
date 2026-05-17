import { GAME_CONFIG } from '../../constants/config';
import { Point } from '../../utils/geometryUtils';
import { Enemy } from '../entities/Enemy';
import { Spark } from '../entities/Spark';
import { Shield } from '../entities/Shield';

export class Renderer {
  private ctx: CanvasRenderingContext2D;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  draw(
    capturedPolygons: Point[][],
    trail: Point[],
    isSlicing: boolean,
    player: Point,
    shieldTime: number,
    fireShieldTime: number,
    slowMotionTime: number,
    enemies: Enemy[],
    spark: Spark,
    shield: Shield
  ) {
    const ctx = this.ctx;
    ctx.fillStyle = GAME_CONFIG.COLORS.BACKGROUND;
    ctx.fillRect(0, 0, GAME_CONFIG.GRID_WIDTH, GAME_CONFIG.GRID_HEIGHT);

    ctx.save();
    // Draw Safe Zones with distinct borders
    ctx.fillStyle = GAME_CONFIG.COLORS.SAFE_ZONE;
    capturedPolygons.forEach(poly => {
      ctx.beginPath();
      poly.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = GAME_CONFIG.COLORS.BORDER;
      ctx.lineWidth = 2;
      ctx.stroke();
    });
    ctx.restore();

    if (isSlicing) {
      ctx.save();
      ctx.strokeStyle = GAME_CONFIG.COLORS.TRAIL;
      ctx.lineWidth = 2;
      ctx.beginPath();
      trail.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
      ctx.stroke();
      ctx.restore();
    }

    // Draw Player with optional shield effect
    ctx.fillStyle = (shieldTime > 0 || fireShieldTime > 0) ? GAME_CONFIG.COLORS.SHIELD : GAME_CONFIG.COLORS.PLAYER;
    if (shieldTime > 0) {
      ctx.beginPath();
      ctx.arc(player.x, player.y, 8, 0, Math.PI * 2);
      ctx.fill();
    } 
    
    if (fireShieldTime > 0) {
      ctx.save();
      ctx.strokeStyle = '#ff5722';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(player.x, player.y, 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    if (shieldTime <= 0 && fireShieldTime <= 0) {
      ctx.fillRect(player.x - 5, player.y - 5, 10, 10);
    }

    enemies.forEach(enemy => enemy.draw(ctx, slowMotionTime > 0));
    spark.draw(ctx);
    shield.draw(ctx);
  }
}