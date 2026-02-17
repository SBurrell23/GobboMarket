import type { Minigame, MinigameResult } from './MinigameBase.js';
import { APPRAISAL_TIME_SECONDS } from '../core/constants.js';
import { gameState } from '../core/GameState.js';

const CARD_ICONS = [
  { icon: '🗡️', name: 'Dagger' },
  { icon: '🛡️', name: 'Shield' },
  { icon: '💍', name: 'Ring' },
  { icon: '🧪', name: 'Potion' },
  { icon: '🏹', name: 'Bow' },
  { icon: '🔮', name: 'Orb' },
  { icon: '👑', name: 'Crown' },
  { icon: '📿', name: 'Amulet' },
  { icon: '🪶', name: 'Feather' },
  { icon: '💎', name: 'Gem' },
];

interface MemoryCard {
  id: number;
  pairId: number;
  icon: string;
  name: string;
  flipped: boolean;
  matched: boolean;
}

export class AppraisalGame implements Minigame {
  readonly type = 'appraisal';
  onComplete: ((result: MinigameResult) => void) | null = null;

  private container: HTMLElement | null = null;
  private tier: number;
  private cards: MemoryCard[] = [];
  private flippedIndices: number[] = [];
  private matchedPairs = 0;
  private totalPairs = 0;
  private mismatches = 0;
  private timeLeft: number;
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private finished = false;
  private lockBoard = false;

  constructor(tier: number = 0) {
    this.tier = tier;
    let bonus = 0;
    if (gameState.hasUpgrade('keen_eye')) bonus += 5;
    if (gameState.hasUpgrade('jewelers_loupe')) bonus += 5;
    this.timeLeft = APPRAISAL_TIME_SECONDS + tier * 5 + bonus;
  }

  start(container: HTMLElement): void {
    this.container = container;
    this.generateCards();
    this.render();
    this.startTimer();
  }

  generateCards(): void {
    const pairCount = 4 + Math.min(this.tier, 4);
    this.totalPairs = pairCount;

    // Pick random icons
    const shuffledIcons = [...CARD_ICONS].sort(() => Math.random() - 0.5);
    const selected = shuffledIcons.slice(0, pairCount);

    const cards: MemoryCard[] = [];
    let id = 0;
    for (let p = 0; p < pairCount; p++) {
      const item = selected[p];
      cards.push({ id: id++, pairId: p, icon: item.icon, name: item.name, flipped: false, matched: false });
      cards.push({ id: id++, pairId: p, icon: item.icon, name: item.name, flipped: false, matched: false });
    }

    // Shuffle cards
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }

    this.cards = cards;
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
    const el = this.container?.querySelector('.memory-timer');
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

    const cols = this.cards.length <= 8 ? 4 : this.cards.length <= 12 ? 4 : 5;

    wrapper.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <p style="font-family: var(--font-display); color: var(--gold); font-size: 1.1rem;">
          Memory Match
        </p>
        <span class="memory-timer" style="font-family: var(--font-display); color: var(--gold); font-size: 1.1rem;">
          ⏳ ${this.timeLeft}s
        </span>
      </div>
      <p style="font-size: 0.85rem; color: var(--ink-dim); margin-bottom: 16px;">
        Flip cards to find matching pairs! Pairs: ${this.matchedPairs}/${this.totalPairs} | Misses: ${this.mismatches}
      </p>
      <div class="memory-grid" style="display: grid; grid-template-columns: repeat(${cols}, 72px); gap: 8px; justify-content: center;"></div>
    `;

    const grid = wrapper.querySelector('.memory-grid')!;

    for (let i = 0; i < this.cards.length; i++) {
      const card = this.cards[i];
      const cardEl = document.createElement('div');
      cardEl.style.cssText = `
        width: 72px; height: 72px;
        display: flex; align-items: center; justify-content: center;
        border-radius: 6px;
        font-size: 2rem;
        cursor: ${card.matched || card.flipped ? 'default' : 'pointer'};
        transition: all 0.2s ease;
        user-select: none;
      `;

      if (card.matched) {
        cardEl.style.background = 'rgba(74, 139, 74, 0.25)';
        cardEl.style.border = '2px solid var(--green)';
        cardEl.textContent = card.icon;
      } else if (card.flipped) {
        cardEl.style.background = 'var(--parchment-light)';
        cardEl.style.border = '2px solid var(--gold-dim)';
        cardEl.textContent = card.icon;
      } else {
        cardEl.style.background = 'var(--parchment)';
        cardEl.style.border = '2px solid var(--parchment-lighter)';
        cardEl.textContent = '?';
        cardEl.style.color = 'var(--ink-dim)';
        cardEl.style.fontSize = '1.5rem';
        cardEl.style.fontFamily = 'var(--font-display)';

        cardEl.addEventListener('mouseenter', () => {
          if (!this.lockBoard && !this.finished) {
            cardEl.style.borderColor = 'var(--gold-dim)';
            cardEl.style.transform = 'scale(1.05)';
          }
        });
        cardEl.addEventListener('mouseleave', () => {
          cardEl.style.borderColor = 'var(--parchment-lighter)';
          cardEl.style.transform = 'scale(1)';
        });

        const idx = i;
        cardEl.addEventListener('click', () => this.handleFlip(idx));
      }

      grid.appendChild(cardEl);
    }

    this.container.appendChild(wrapper);
  }

  handleFlip(index: number): void {
    if (this.finished || this.lockBoard) return;
    const card = this.cards[index];
    if (card.flipped || card.matched) return;

    card.flipped = true;
    this.flippedIndices.push(index);
    this.render();

    if (this.flippedIndices.length === 2) {
      this.lockBoard = true;
      const [first, second] = this.flippedIndices;
      const cardA = this.cards[first];
      const cardB = this.cards[second];

      if (cardA.pairId === cardB.pairId) {
        cardA.matched = true;
        cardB.matched = true;
        this.matchedPairs++;
        this.flippedIndices = [];
        this.lockBoard = false;
        this.render();

        if (this.matchedPairs >= this.totalPairs) {
          this.finishGame(true);
        }
      } else {
        this.mismatches++;
        setTimeout(() => {
          cardA.flipped = false;
          cardB.flipped = false;
          this.flippedIndices = [];
          this.lockBoard = false;
          this.render();
        }, 800);
      }
    }
  }

  private finishGame(won: boolean): void {
    if (this.finished) return;
    this.finished = true;
    if (this.timerInterval) clearInterval(this.timerInterval);

    if (!this.container) return;
    this.container.innerHTML = '';

    const efficiency = Math.max(0, 1 - this.mismatches * 0.1);
    const quality = won
      ? (this.mismatches <= 2 ? 4 : this.mismatches <= 4 ? 3 : 2)
      : Math.min(1, Math.floor(this.matchedPairs / this.totalPairs * 2));

    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'text-align: center; padding: 16px;';

    wrapper.innerHTML = `
      <p style="font-family: var(--font-display); color: ${won ? 'var(--green-bright)' : 'var(--accent-bright)'}; font-size: 1.3rem; margin-bottom: 16px;">
        ${won ? 'All Pairs Found!' : "Time's Up!"}
      </p>
      <p style="color: var(--ink); margin-bottom: 4px;">
        Pairs matched: ${this.matchedPairs} / ${this.totalPairs}
      </p>
      <p style="color: var(--ink-dim); margin-bottom: 16px;">
        Mismatches: ${this.mismatches} | Efficiency: ${Math.round(efficiency * 100)}%
      </p>
      <button class="btn btn-gold done-btn">Continue</button>
    `;

    this.container.appendChild(wrapper);

    wrapper.querySelector('.done-btn')!.addEventListener('click', () => {
      const score = won ? Math.round(efficiency * 100) : Math.round((this.matchedPairs / this.totalPairs) * 50);
      const result: MinigameResult = {
        score,
        quality,
        multiplier: won ? 1.0 : 0.5,
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
      cards: this.cards.map(c => ({ ...c })),
      matchedPairs: this.matchedPairs,
      totalPairs: this.totalPairs,
      mismatches: this.mismatches,
      timeLeft: this.timeLeft,
      finished: this.finished,
    };
  }
}
