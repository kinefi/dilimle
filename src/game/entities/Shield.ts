import { GAME_CONFIG } from '../../constants/config';
import { Point } from '../../utils/geometryUtils';

export enum ShieldType {
  NORMAL,
  FIRE,
  SLOW_MOTION,
}

export class Shield {
  public x: number = 0;
  public y: number = 0;
  public isActive: boolean = false;
  public type: ShieldType = ShieldType.NORMAL;
  private radius: number = 10;

  spawn(voidPolygons: Point[][], type: ShieldType = ShieldType.NORMAL) {
    if (voidPolygons.length === 0) return;
    this.type = type;
    
    // Pick a random polygon from the void
    const poly = voidPolygons[Math.floor(Math.random() * voidPolygons.length)];
    
    // Pick a random point within the bounding box of that polygon
    const minX = Math.min(...poly.map(p => p.x));
    const maxX = Math.max(...poly.map(p => p.x));
    const minY = Math.min(...poly.map(p => p.y));
    const maxY = Math.max(...poly.map(p => p.y));

    this.x = minX + Math.random() * (maxX - minX);
    this.y = minY + Math.random() * (maxY - minY);
    this.isActive = true;
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (!this.isActive) return;
    
    switch (this.type) {
      case ShieldType.FIRE: ctx.fillStyle = '#ff5722'; break;
      case ShieldType.SLOW_MOTION: ctx.fillStyle = '#00e5ff'; break;
      default: ctx.fillStyle = GAME_CONFIG.COLORS.SHIELD;
    }

    ctx.shadowBlur = 15;
    ctx.shadowColor = ctx.fillStyle;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}