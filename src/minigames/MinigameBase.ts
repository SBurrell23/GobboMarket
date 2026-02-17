export interface MinigameResult {
  score: number;
  quality: number;
  multiplier: number;
  completed: boolean;
}

export interface Minigame {
  readonly type: string;
  start(container: HTMLElement): void;
  destroy(): void;
  onComplete: ((result: MinigameResult) => void) | null;
}
