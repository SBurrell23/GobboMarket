export interface MinigameResult {
  score: number;
  quality: number;
  multiplier: number;
  completed: boolean;
  /** Haggle minigame only: win, settle, or bust */
  haggleOutcome?: 'win' | 'settle' | 'bust';
}

export interface Minigame {
  readonly type: string;
  start(container: HTMLElement): void;
  destroy(): void;
  onComplete: ((result: MinigameResult) => void) | null;
}
