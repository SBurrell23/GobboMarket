export interface MinigameResult {
  score: number;
  quality: number;
  multiplier: number;
  completed: boolean;
  /** Haggle minigame only: win, settle, or bust */
  haggleOutcome?: 'win' | 'settle' | 'bust';
  /** Haggle minigame only: customer's d20 roll */
  customerRoll?: number;
  /** Forge minigame only: sum of per-strike scores (each 0–100) */
  forgeCombinedScore?: number;
  /** Buy/reaction minigame only: reaction time in ms (only set when not clicked early) */
  reactionMs?: number;
}

export interface Minigame {
  readonly type: string;
  start(container: HTMLElement): void;
  destroy(): void;
  onComplete: ((result: MinigameResult) => void) | null;
}
