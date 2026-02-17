import type { Minigame, MinigameResult } from './MinigameBase.js';
import { RUNECRAFT_TIME_SECONDS, RUNECRAFT_ENCHANT_MULTIPLIER } from '../core/constants.js';
import { gameState } from '../core/GameState.js';

const RUNE_SYMBOLS = ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ'];

export class RuneCraftGame implements Minigame {
  readonly type = 'runecraft';
  onComplete: ((result: MinigameResult) => void) | null = null;

  private container: HTMLElement | null = null;
  private tier: number;
  private tiles: (string | null)[] = [];
  private targetTiles: (string | null)[] = [];
  private emptyIndex = 8;
  private moves = 0;
  private timeLeft: number;
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private finished = false;

  constructor(tier: number = 0) {
    this.tier = tier;
    let bonus = 0;
    if (gameState.hasUpgrade('keen_eye')) bonus += 5;
    if (gameState.hasUpgrade('jewelers_loupe')) bonus += 5;
    this.timeLeft = RUNECRAFT_TIME_SECONDS + tier * 5 + bonus;
  }

  start(container: HTMLElement): void {
    this.container = container;
    this.generatePuzzle();
    this.render();
    this.startTimer();
  }

  generatePuzzle(): void {
    // Pick 8 runes for the solved state
    const runes = [...RUNE_SYMBOLS];
    this.targetTiles = [...runes, null];
    this.tiles = [...this.targetTiles];
    this.emptyIndex = 8;

    // Shuffle by performing random valid slides (guarantees solvability)
    const libraryReduction = gameState.hasUpgrade('rune_library') ? 10 : 0;
    const shuffleMoves = Math.max(15, 30 + this.tier * 10 - libraryReduction);
    for (let i = 0; i < shuffleMoves; i++) {
      const neighbors = this.getNeighbors(this.emptyIndex);
      const pick = neighbors[Math.floor(Math.random() * neighbors.length)];
      this.swapTiles(pick, this.emptyIndex);
      this.emptyIndex = pick;
    }

    // Make sure it's not already solved
    while (this.checkWin()) {
      const neighbors = this.getNeighbors(this.emptyIndex);
      const pick = neighbors[0];
      this.swapTiles(pick, this.emptyIndex);
      this.emptyIndex = pick;
    }
  }

  private getNeighbors(index: number): number[] {
    const row = Math.floor(index / 3);
    const col = index % 3;
    const neighbors: number[] = [];
    if (row > 0) neighbors.push(index - 3);
    if (row < 2) neighbors.push(index + 3);
    if (col > 0) neighbors.push(index - 1);
    if (col < 2) neighbors.push(index + 1);
    return neighbors;
  }

  private swapTiles(a: number, b: number): void {
    [this.tiles[a], this.tiles[b]] = [this.tiles[b], this.tiles[a]];
  }

  private startTimer(): void {
    this.timerInterval = setInterval(() => {
      this.timeLeft--;
      this.updateTimerDisplay();
      if (this.timeLeft <= 0) {
        this.finishGame(false);
      }
    }, 1000);
  }

  private updateTimerDisplay(): void {
    const el = this.container?.querySelector('.runecraft-timer');
    if (el) {
      el.textContent = `⏳ ${this.timeLeft}s`;
      if (this.timeLeft <= 5) {
        (el as HTMLElement).style.color = 'var(--accent-bright)';
      }
    }
  }

  private render(): void {
    if (!this.container) return;
    this.container.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'padding: 16px;';

    const matchCount = this.countMatches();

    wrapper.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <p style="font-family: var(--font-display); color: var(--gold); font-size: 1.1rem;">
          Rune Sliding Puzzle
        </p>
        <span class="runecraft-timer" style="font-family: var(--font-display); color: var(--gold); font-size: 1.1rem;">
          ⏳ ${this.timeLeft}s
        </span>
      </div>
      <p style="font-size: 0.85rem; color: var(--ink-dim); margin-bottom: 12px;">
        Slide runes to match the target pattern. Moves: ${this.moves} | Correct: ${matchCount}/9
      </p>

      <div style="display: flex; gap: 32px; justify-content: center; flex-wrap: wrap;">
        <div>
          <p style="text-align: center; color: var(--ink-dim); font-size: 0.85rem; margin-bottom: 8px;">Target</p>
          <div class="slide-grid slide-grid-target" style="display: grid; grid-template-columns: repeat(3, 56px); gap: 4px;"></div>
        </div>
        <div>
          <p style="text-align: center; color: var(--ink-dim); font-size: 0.85rem; margin-bottom: 8px;">Your Runes</p>
          <div class="slide-grid slide-grid-player" style="display: grid; grid-template-columns: repeat(3, 56px); gap: 4px;"></div>
        </div>
      </div>
    `;

    const targetGrid = wrapper.querySelector('.slide-grid-target')!;
    const playerGrid = wrapper.querySelector('.slide-grid-player')!;

    for (let i = 0; i < 9; i++) {
      // Target cell
      const targetCell = document.createElement('div');
      targetCell.style.cssText = this.cellBaseStyle(false);
      if (this.targetTiles[i] === null) {
        targetCell.style.background = 'var(--bg-dark)';
        targetCell.style.border = '2px dashed var(--parchment-lighter)';
      } else {
        targetCell.textContent = this.targetTiles[i]!;
        targetCell.style.opacity = '0.7';
      }
      targetGrid.appendChild(targetCell);

      // Player cell
      const playerCell = document.createElement('div');
      if (this.tiles[i] === null) {
        playerCell.style.cssText = this.cellBaseStyle(false);
        playerCell.style.background = 'var(--bg-dark)';
        playerCell.style.border = '2px dashed var(--parchment-lighter)';
      } else {
        const isNeighbor = this.getNeighbors(this.emptyIndex).includes(i);
        playerCell.style.cssText = this.cellBaseStyle(isNeighbor);
        playerCell.textContent = this.tiles[i]!;

        const isCorrect = this.tiles[i] === this.targetTiles[i];
        if (isCorrect) {
          playerCell.style.borderColor = 'var(--green)';
          playerCell.style.background = 'rgba(74, 139, 74, 0.2)';
        }

        if (isNeighbor) {
          const idx = i;
          playerCell.addEventListener('click', () => this.handleSlide(idx));
          playerCell.addEventListener('mouseenter', () => {
            if (!this.finished) playerCell.style.borderColor = 'var(--gold-bright)';
          });
          playerCell.addEventListener('mouseleave', () => {
            if (!this.finished) {
              playerCell.style.borderColor = isCorrect ? 'var(--green)' : 'var(--parchment-lighter)';
            }
          });
        }
      }
      playerGrid.appendChild(playerCell);
    }

    this.container.appendChild(wrapper);
  }

  private cellBaseStyle(interactive: boolean): string {
    return `
      width: 56px; height: 56px;
      display: flex; align-items: center; justify-content: center;
      background: var(--parchment-light);
      border: 2px solid var(--parchment-lighter);
      border-radius: 4px;
      font-size: 1.6rem;
      cursor: ${interactive ? 'pointer' : 'default'};
      transition: all 0.15s ease;
      user-select: none;
    `;
  }

  handleSlide(index: number): void {
    if (this.finished) return;
    if (!this.getNeighbors(this.emptyIndex).includes(index)) return;

    this.swapTiles(index, this.emptyIndex);
    this.emptyIndex = index;
    this.moves++;

    if (this.checkWin()) {
      this.finishGame(true);
      return;
    }

    this.render();
  }

  countMatches(): number {
    let count = 0;
    for (let i = 0; i < 9; i++) {
      if (this.tiles[i] === this.targetTiles[i]) count++;
    }
    return count;
  }

  checkWin(): boolean {
    return this.tiles.every((t, i) => t === this.targetTiles[i]);
  }

  private finishGame(won: boolean): void {
    if (this.finished) return;
    this.finished = true;
    if (this.timerInterval) clearInterval(this.timerInterval);

    if (!this.container) return;
    this.container.innerHTML = '';

    const matchRatio = this.countMatches() / 9;
    const multiplier = won ? RUNECRAFT_ENCHANT_MULTIPLIER + this.tier * 0.1 : 1 + matchRatio * 0.3;

    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'text-align: center; padding: 16px;';

    wrapper.innerHTML = `
      <p style="font-family: var(--font-display); color: ${won ? 'var(--green-bright)' : 'var(--accent-bright)'}; font-size: 1.3rem; margin-bottom: 16px;">
        ${won ? 'Enchantment Complete!' : "Time's Up!"}
      </p>
      <p style="color: var(--ink); margin-bottom: 8px;">
        ${won ? `Solved in ${this.moves} moves` : `Placed ${this.countMatches()} of 9 runes correctly`}
      </p>
      <p style="color: var(--blue-bright); font-size: 1.1rem; margin-bottom: 16px;">
        Enchant multiplier: x${multiplier.toFixed(2)}
      </p>
      <button class="btn btn-gold done-btn">Continue</button>
    `;

    this.container.appendChild(wrapper);

    wrapper.querySelector('.done-btn')!.addEventListener('click', () => {
      const result: MinigameResult = {
        score: won ? 100 : Math.round(matchRatio * 100),
        quality: 0,
        multiplier,
        completed: true,
      };
      if (this.onComplete) this.onComplete(result);
    });
  }

  destroy(): void {
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.container) this.container.innerHTML = '';
  }

  getState() {
    return {
      tiles: [...this.tiles],
      targetTiles: [...this.targetTiles],
      emptyIndex: this.emptyIndex,
      moves: this.moves,
      timeLeft: this.timeLeft,
      finished: this.finished,
    };
  }
}
