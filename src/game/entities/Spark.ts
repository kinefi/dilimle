import type { Point } from '../../utils/geometryUtils';

export class Spark {
  public x = 0;
  public y = 0;
  private trailIndex = 0;
  private speed = 2.5;
  public isActive = false;
  private readonly COLLISION_RADIUS = 10;
  private readonly GRACE_PERIOD_INDEX = 10;

  activate(startPoint: Point) {
    this.x = startPoint.x;
    this.y = startPoint.y;
    this.trailIndex = 0;
    this.isActive = true;
  }

  update(trail: Point[], playerPos: Point): boolean {
    if (!this.isActive || trail.length === 0) return false;

    // Target the next point in the trail or the player if at the end
    const target = trail[this.trailIndex + 1] || playerPos;

    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < this.speed) {
      this.x = target.x;
      this.y = target.y;
      if (this.trailIndex < trail.length - 1) this.trailIndex++;
    } else {
      this.x += (dx / dist) * this.speed;
      this.y += (dy / dist) * this.speed;
    }

    // Check collision with player
    // Only check collision if the spark has moved away from the start of the trail
    // to prevent instant "game over" on spawn.
    const playerDist = Math.sqrt(
      Math.pow(this.x - playerPos.x, 2) + Math.pow(this.y - playerPos.y, 2),
    );
    return this.trailIndex > this.GRACE_PERIOD_INDEX && playerDist < this.COLLISION_RADIUS;
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (!this.isActive) return;
    ctx.fillStyle = '#00ffff';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00ffff';
    ctx.fillRect(this.x - 4, this.y - 4, 8, 8);
    ctx.shadowBlur = 0;
  }
}
