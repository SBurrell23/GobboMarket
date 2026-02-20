import type { Minigame, MinigameResult } from './MinigameBase.js';
import { QUALITY_LABELS } from '../core/constants.js';
import { gameState } from '../core/GameState.js';
import { soundManager } from '../audio/SoundManager.js';

const WAIT_MIN_MS = 1000;
const WAIT_MAX_MS = 6000;
const REACTION_MASTERWORK_MS = 250;
const REACTION_SUPERIOR_MS = 300;
const REACTION_FINE_MS = 450;
const REACTION_PASSABLE_MS = 600;

type Phase = 'waiting' | 'ready' | 'done';

function getReactionThresholds(): { masterwork: number; superior: number; fine: number; passable: number } {
  const ease = gameState.getUpgradeRank('auctioneers_reflex') * 30;
  return {
    masterwork: REACTION_MASTERWORK_MS + ease,
    superior: REACTION_SUPERIOR_MS + ease,
    fine: REACTION_FINE_MS + ease,
    passable: REACTION_PASSABLE_MS + ease,
  };
}

function reactionMsToQuality(ms: number, wasEarly: boolean): number {
  if (wasEarly) return 0;
  const t = getReactionThresholds();
  if (ms < t.masterwork) return 4;
  if (ms < t.superior) return 3;
  if (ms < t.fine) return 2;
  if (ms < t.passable) return 1;
  return 0;
}

export class ReactionTimeGame implements Minigame {
  readonly type = 'appraisal';
  onComplete: ((result: MinigameResult) => void) | null = null;

  private container: HTMLElement | null = null;
  private phase: Phase = 'waiting';
  private readyAt = 0;
  private waitTimeout: ReturnType<typeof setTimeout> | null = null;
  private clickHandler: (() => void) | null = null;
  private keyHandler: ((e: KeyboardEvent) => void) | null = null;

  start(container: HTMLElement): void {
    this.container = container;
    this.container.innerHTML = '';
    this.phase = 'waiting';

    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'text-align: center; padding: 32px; min-height: 200px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer;';
    wrapper.id = 'reaction-game-area';

    wrapper.innerHTML = `
      <p style="font-family: var(--font-display); color: var(--gold); font-size: 2rem; margin-bottom: 12px;">
        Wait...
      </p>
      <span class="reaction-clock-spin" style="font-size: 2.5rem;">🕐</span>
    `;

    this.container.appendChild(wrapper);

    this.clickHandler = () => this.handleTrigger();
    wrapper.addEventListener('mousedown', this.clickHandler);

    this.keyHandler = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        this.handleTrigger();
      }
    };
    window.addEventListener('keydown', this.keyHandler);

    soundManager.playLoop('reaction_clock_tick', { volume: 0.4 });
    const delay = WAIT_MIN_MS + Math.random() * (WAIT_MAX_MS - WAIT_MIN_MS);
    this.waitTimeout = setTimeout(() => this.showBuy(), delay);
  }

  private showBuy(): void {
    this.waitTimeout = null;
    if (!this.container || this.phase !== 'waiting') return;

    soundManager.stopLoop('reaction_clock_tick');
    soundManager.play('reaction_buy');
    this.phase = 'ready';

    const area = this.container.querySelector('#reaction-game-area');
    if (area) {
      (area as HTMLElement).innerHTML = `
        <p style="font-family: var(--font-display); color: var(--green-bright, #4ade80); font-size: 3rem; font-weight: bold; margin: 0;">
          Buy!
        </p>
      `;
    }

    // Sync timestamp with when the stimulus is actually displayed (next paint).
    // This fixes inflated reaction times from measuring before the user sees "Buy!".
    requestAnimationFrame(() => {
      this.readyAt = performance.now();
    });
  }

  private handleTrigger(): void {
    if (!this.container || this.phase === 'done') return;

    this.removeInputHandlers();

    const wasEarly = this.phase === 'waiting';
    if (wasEarly) soundManager.stopLoop('reaction_clock_tick');
    const reactionMs = wasEarly ? 0 : Math.round(performance.now() - this.readyAt);
    const quality = reactionMsToQuality(reactionMs, wasEarly);
    const score = wasEarly ? 0 : Math.max(0, Math.round(100 - reactionMs / 5));

    if (quality >= 4) soundManager.play('reaction_masterwork');
    else if (quality >= 2) soundManager.play('reaction_good');
    else if (quality >= 1) soundManager.play('reaction_passable');
    else soundManager.play('reaction_shoddy');

    this.phase = 'done';
    if (this.waitTimeout) {
      clearTimeout(this.waitTimeout);
      this.waitTimeout = null;
    }

    const areaEl = this.container.querySelector('#reaction-game-area');
    if (areaEl) {
      const label = QUALITY_LABELS[quality];
      (areaEl as HTMLElement).innerHTML = `
        <p style="font-family: var(--font-display); color: ${['var(--ink)', 'var(--quality-passable)', 'var(--quality-fine)', 'var(--quality-superior)', 'var(--quality-masterwork)'][Math.min(quality, 4)]}; font-size: 1.3rem; margin-bottom: 8px;">
          ${wasEarly ? 'Too early!' : quality >= 4 ? 'Lightning fast!' : quality >= 2 ? 'Good timing!' : 'Better luck next time!'}
        </p>
        <p style="color: var(--ink); margin-bottom: 4px;">Quality: <strong style="color: ${['var(--quality-shoddy)', 'var(--quality-passable)', 'var(--quality-fine)', 'var(--quality-superior)', 'var(--quality-masterwork)'][Math.min(quality, 4)]};">${label}</strong></p>
        <p style="color: var(--ink-dim); margin-bottom: 20px;">${wasEarly ? 'Wait for Buy! next time' : `${reactionMs}ms reaction`}</p>
        <button class="btn btn-gold done-btn">Continue</button>
      `;

      (areaEl as HTMLElement).querySelector('.done-btn')!.addEventListener('click', () => {
        const result: MinigameResult = {
          score,
          quality,
          multiplier: 1,
          completed: true,
        };
        if (this.onComplete) this.onComplete(result);
      });
    }
  }

  private removeInputHandlers(): void {
    const area = this.container?.querySelector('#reaction-game-area');
    if (area && this.clickHandler) {
      (area as HTMLElement).removeEventListener('mousedown', this.clickHandler);
      this.clickHandler = null;
    }
    if (this.keyHandler) {
      window.removeEventListener('keydown', this.keyHandler);
      this.keyHandler = null;
    }
  }

  destroy(): void {
    soundManager.stopLoop('reaction_clock_tick');
    if (this.waitTimeout) {
      clearTimeout(this.waitTimeout);
      this.waitTimeout = null;
    }
    this.removeInputHandlers();
    if (this.container) this.container.innerHTML = '';
  }

  getState() {
    return {
      phase: this.phase,
      readyAt: this.readyAt,
    };
  }
}
