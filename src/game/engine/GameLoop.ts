export class GameLoop {
  private isRunning = false;
  private rafId: number | null = null;
  private update: () => void;
  private draw: () => void;

  constructor(update: () => void, draw: () => void) {
    this.update = update;
    this.draw = draw;
  }

  start(): void {
    if (!this.isRunning) {
      this.isRunning = true;
      this.loop();
    }
  }

  stop(): void {
    this.isRunning = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
    }
  }

  private loop = (): void => {
    if (!this.isRunning) return;
    this.update();
    this.draw();
    this.rafId = requestAnimationFrame(this.loop);
  };
}
