export type TickCallback = (dt: number) => void;

export class GameLoop {
  private running = false;
  private lastTime = 0;
  private animFrameId = 0;
  private callbacks = new Set<TickCallback>();

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.tick(this.lastTime);
  }

  stop(): void {
    this.running = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = 0;
    }
  }

  addCallback(cb: TickCallback): void {
    this.callbacks.add(cb);
  }

  removeCallback(cb: TickCallback): void {
    this.callbacks.delete(cb);
  }

  get isRunning(): boolean {
    return this.running;
  }

  private tick = (now: number): void => {
    if (!this.running) return;
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;
    for (const cb of this.callbacks) {
      cb(dt);
    }
    this.animFrameId = requestAnimationFrame(this.tick);
  };
}

export const gameLoop = new GameLoop();
