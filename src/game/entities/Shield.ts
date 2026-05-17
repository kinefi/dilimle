import { GAME_CONFIG } from '../../constants/config';
import type { Point } from '../../utils/geometryUtils';
import { isPointInPolygon } from '../../utils/geometryUtils';

export enum ShieldType {
  NORMAL,
  FIRE,
  SLOW_MOTION,
}

export class Shield {
  public x = 0;
  public y = 0;
  public isActive = false;
  public type: ShieldType = ShieldType.NORMAL;
  private radius = 10;

  spawn(voidPolygons: Point[][], type: ShieldType = ShieldType.NORMAL) {
    if (voidPolygons.length === 0) return;
    this.type = type;

    // Pick a random polygon from the void
    const poly = voidPolygons[Math.floor(Math.random() * voidPolygons.length)];

    // Pick a random point within the bounding box of that polygon
    const minX = Math.min(...poly.map((p) => p.x));
    const maxX = Math.max(...poly.map((p) => p.x));
    const minY = Math.min(...poly.map((p) => p.y));
    const maxY = Math.max(...poly.map((p) => p.y));

    let attempts = 0;
    while (attempts < 50) {
      const tx = minX + Math.random() * (maxX - minX);
      const ty = minY + Math.random() * (maxY - minY);

      if (isPointInPolygon({ x: tx, y: ty }, poly)) {
        this.x = tx;
        this.y = ty;
        this.isActive = true;
        return;
      }
      attempts++;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (!this.isActive) return;

    switch (this.type) {
      case ShieldType.FIRE:
        ctx.fillStyle = '#ff5722';
        break;
      case ShieldType.SLOW_MOTION:
        ctx.fillStyle = '#00e5ff';
        break;
      default:
        ctx.fillStyle = GAME_CONFIG.COLORS.SHIELD;
    }

    ctx.shadowBlur = 15;
    ctx.shadowColor = ctx.fillStyle;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}
