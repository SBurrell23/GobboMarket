import type { Minigame, MinigameResult } from './MinigameBase.js';
import { FORGE_STRIKES, FORGE_BASE_WINDOW, FORGE_TIER_TIGHTENING } from '../core/constants.js';
import { gameState } from '../core/GameState.js';
import { soundManager } from '../audio/SoundManager.js';

export class ForgeGame implements Minigame {
  readonly type = 'forge';
  onComplete: ((result: MinigameResult) => void) | null = null;

  private container: HTMLElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animFrame = 0;
  private running = false;
  private lastFrameTime = 0;

  private tier: number;
  private strikes: number[] = [];
  private currentStrike = 0;
  private meterPosition = 0;
  private meterDirection = 1;
  private meterSpeed = 0.6;
  private sweetSpotCenter = 0.5;
  private sweetSpotWidth: number;
  private waitingForStrike = true;
  private strikeFlashTimer = 0;
  private lastStrikeAccuracy = 0;

  constructor(tier: number = 0) {
    this.tier = tier;
    const baseWidth = FORGE_BASE_WINDOW - tier * FORGE_TIER_TIGHTENING;
    this.sweetSpotWidth = Math.max(0.08, baseWidth);
  }

  start(container: HTMLElement): void {
    this.container = container;
    this.container.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'minigame-canvas-wrapper';

    this.canvas = document.createElement('canvas');
    this.canvas.width = 600;
    this.canvas.height = 300;
    wrapper.appendChild(this.canvas);

    const info = document.createElement('div');
    info.style.cssText = 'text-align: center; padding: 12px; color: var(--ink);';
    info.innerHTML = `
      <p style="font-family: var(--font-display); color: var(--gold); font-size: 1.1rem; margin-bottom: 4px;">
        Strike ${this.currentStrike + 1} of ${FORGE_STRIKES}
      </p>
      <p style="font-size: 0.85rem; color: var(--ink-dim);">Click or press Space when the marker is in the golden zone!</p>
    `;
    this.infoEl = info;

    container.appendChild(wrapper);
    container.appendChild(info);

    this.ctx = this.canvas.getContext('2d');
    this.running = true;
    this.meterPosition = 0;
    this.meterDirection = 1;
    let speed = 1.2 + this.tier * 0.16;
    speed *= Math.pow(0.90, gameState.getUpgradeRank('forge_bellows'));
    this.meterSpeed = speed;
    this.randomizeSweetSpot();

    this.handleClick = this.handleClick.bind(this);
    this.handleKey = this.handleKey.bind(this);

    // Delay registering click listener so the click that opened the overlay
    // doesn't immediately trigger the first strike
    requestAnimationFrame(() => {
      if (!this.running) return;
      document.addEventListener('mousedown', this.handleClick);
      document.addEventListener('keydown', this.handleKey);
    });

    this.lastFrameTime = performance.now();
    this.tick();
  }

  private infoEl: HTMLElement | null = null;

  private randomizeSweetSpot(): void {
    this.sweetSpotCenter = 0.25 + Math.random() * 0.5;
  }

  private handleClick = (): void => {
    this.doStrike();
  };

  private handleKey = (e: KeyboardEvent): void => {
    if (e.code === 'Space') {
      e.preventDefault();
      this.doStrike();
    }
  };

  private doStrike(): void {
    if (!this.waitingForStrike || !this.running) return;
    this.waitingForStrike = false;
    soundManager.play('forge_strike');

    const distance = Math.abs(this.meterPosition - this.sweetSpotCenter);
    const halfGreen = this.sweetSpotWidth / 2;
    const halfYellow = this.sweetSpotWidth;
    let accuracy: number;
    if (distance <= halfGreen) {
      accuracy = 1 - (distance / halfGreen) * 0.5;
    } else if (distance <= halfYellow) {
      accuracy = 0.5 * (1 - (distance - halfGreen) / (halfYellow - halfGreen));
    } else {
      accuracy = 0;
    }

    this.strikes.push(accuracy);
    this.lastStrikeAccuracy = accuracy;
    this.strikeFlashTimer = 0.5;
    this.currentStrike++;

    if (this.currentStrike >= FORGE_STRIKES) {
      setTimeout(() => this.finish(), 600);
    } else {
      setTimeout(() => {
        this.waitingForStrike = true;
        this.meterSpeed += 0.1;
        this.randomizeSweetSpot();
        if (this.infoEl) {
          this.infoEl.querySelector('p')!.innerHTML =
            `Strike ${this.currentStrike + 1} of ${FORGE_STRIKES}`;
        }
      }, 500);
    }
  }

  private finish(): void {
    this.running = false;
    const avgScore = this.strikes.reduce((a, b) => a + b, 0) / this.strikes.length;
    const quality = avgScore >= 0.9 ? 4 : avgScore >= 0.7 ? 3 : avgScore >= 0.4 ? 2 : avgScore >= 0.15 ? 1 : 0;
    const result: MinigameResult = {
      score: Math.round(avgScore * 100),
      quality,
      multiplier: 1,
      completed: true,
    };
    if (this.onComplete) this.onComplete(result);
  }

  private tick = (): void => {
    if (!this.running) return;
    const now = performance.now();
    const dt = Math.min((now - this.lastFrameTime) / 1000, 0.1);
    this.lastFrameTime = now;

    if (this.waitingForStrike) {
      this.meterPosition += this.meterDirection * this.meterSpeed * dt;
      if (this.meterPosition >= 1) {
        this.meterPosition = 1;
        this.meterDirection = -1;
        soundManager.play('forge_tick', { volume: 0.4 });
      } else if (this.meterPosition <= 0) {
        this.meterPosition = 0;
        this.meterDirection = 1;
        soundManager.play('forge_tick', { volume: 0.4 });
      }
    }

    if (this.strikeFlashTimer > 0) {
      this.strikeFlashTimer -= dt;
    }

    this.render();
    this.animFrame = requestAnimationFrame(this.tick);
  };

  private render(): void {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = 600;
    const h = 300;

    ctx.fillStyle = '#1a1207';
    ctx.fillRect(0, 0, w, h);

    // Anvil
    ctx.fillStyle = '#3d2e1c';
    ctx.fillRect(220, 200, 160, 80);
    ctx.fillStyle = '#555';
    ctx.fillRect(230, 180, 140, 30);
    ctx.fillRect(260, 160, 80, 25);

    // Meter bar background
    const barX = 50;
    const barY = 40;
    const barW = 500;
    const barH = 40;
    ctx.fillStyle = '#2d2011';
    ctx.strokeStyle = '#4d3c28';
    ctx.lineWidth = 2;
    ctx.fillRect(barX, barY, barW, barH);
    ctx.strokeRect(barX, barY, barW, barH);

    // Yellow partial-hit zone (wider area behind the green zone)
    const yellowWidth = this.sweetSpotWidth * 2;
    const yellowStart = (this.sweetSpotCenter - yellowWidth / 2) * barW + barX;
    const yellowW = yellowWidth * barW;
    ctx.fillStyle = 'rgba(212, 168, 67, 0.25)';
    ctx.fillRect(yellowStart, barY, yellowW, barH);
    ctx.strokeStyle = 'rgba(212, 168, 67, 0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(yellowStart, barY, yellowW, barH);

    // Sweet spot (green zone)
    const spotStart = (this.sweetSpotCenter - this.sweetSpotWidth / 2) * barW + barX;
    const spotW = this.sweetSpotWidth * barW;
    ctx.fillStyle = 'rgba(90, 180, 90, 0.4)';
    ctx.fillRect(spotStart, barY, spotW, barH);
    ctx.strokeStyle = '#5aab5a';
    ctx.lineWidth = 2;
    ctx.strokeRect(spotStart, barY, spotW, barH);

    // Meter indicator
    const indicatorX = this.meterPosition * barW + barX;
    ctx.fillStyle = this.strikeFlashTimer > 0
      ? (this.lastStrikeAccuracy > 0.5 ? '#5aab5a' : '#b04a4a')
      : '#c9b896';
    ctx.fillRect(indicatorX - 2, barY - 5, 4, barH + 10);

    // Strike indicators
    ctx.font = '14px "Crimson Text", serif';
    ctx.textAlign = 'center';
    for (let i = 0; i < FORGE_STRIKES; i++) {
      const cx = 250 + i * 100;
      const cy = 120;
      if (i < this.strikes.length) {
        const acc = this.strikes[i];
        ctx.fillStyle = acc >= 0.7 ? '#5aab5a' : acc >= 0.3 ? '#d4a843' : '#b04a4a';
        ctx.beginPath();
        ctx.arc(cx, cy, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1a1207';
        ctx.fillText(`${Math.round(acc * 100)}`, cx, cy + 5);
      } else {
        ctx.strokeStyle = '#4d3c28';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, 15, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Sparks on strike
    if (this.strikeFlashTimer > 0) {
      const sparkCount = 8;
      const intensity = this.strikeFlashTimer / 0.5;
      for (let i = 0; i < sparkCount; i++) {
        const angle = (i / sparkCount) * Math.PI * 2;
        const dist = (1 - intensity) * 40 + 10;
        const sx = 300 + Math.cos(angle) * dist;
        const sy = 185 + Math.sin(angle) * dist * 0.5;
        ctx.fillStyle = `rgba(240, 200, 80, ${intensity})`;
        ctx.beginPath();
        ctx.arc(sx, sy, 2 + intensity * 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  destroy(): void {
    this.running = false;
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    document.removeEventListener('mousedown', this.handleClick);
    document.removeEventListener('keydown', this.handleKey);
    if (this.container) this.container.innerHTML = '';
  }

  // For testing: get the game state
  getState() {
    return {
      meterPosition: this.meterPosition,
      sweetSpotCenter: this.sweetSpotCenter,
      sweetSpotWidth: this.sweetSpotWidth,
      strikes: [...this.strikes],
      currentStrike: this.currentStrike,
      running: this.running,
    };
  }

  // For testing: set meter position
  setMeterPosition(pos: number): void {
    this.meterPosition = pos;
  }

  // For testing: trigger strike directly
  triggerStrike(): void {
    this.doStrike();
  }
}
