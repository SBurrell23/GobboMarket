import type { Minigame, MinigameResult } from './MinigameBase.js';
import { gameState } from '../core/GameState.js';
import { calculateReputationGain } from '../progression/Reputation.js';
import type { Customer } from '../market/Customer.js';
import { soundManager } from '../audio/SoundManager.js';

export class HaggleGame implements Minigame {
  readonly type = 'haggle';
  onComplete: ((result: MinigameResult) => void) | null = null;

  private container: HTMLElement | null = null;
  private customer: Customer;
  private itemQuality: number;
  private customerRoll = 0;
  private playerTotal = 0;
  private playerRolls: number[] = [];
  private phase: 'customer-roll' | 'player-turn' | 'result' = 'customer-roll';
  private outcome: 'win' | 'bust' | 'settle' | null = null;

  constructor(customer: Customer, itemQuality: number = 2) {
    this.customer = customer;
    this.itemQuality = itemQuality;
  }

  start(container: HTMLElement): void {
    this.container = container;
    this.rollCustomerDie();
  }

  private rollCustomerDie(): void {
    // Higher haggle skill = higher minimum roll
    const minRoll = Math.ceil(this.customer.haggleSkill * 8);
    this.customerRoll = minRoll + Math.floor(Math.random() * (20 - minRoll)) + 1;
    this.customerRoll = Math.min(20, Math.max(1, this.customerRoll));

    this.customerRoll = Math.max(1, this.customerRoll - gameState.getUpgradeRank('hagglers_dice'));

    this.phase = 'player-turn';
    this.renderPlayerTurn();
  }

  private renderPlayerTurn(): void {
    if (!this.container) return;
    this.container.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'text-align: center; padding: 16px;';

    const remaining = this.customerRoll - this.playerTotal;
    const canWin = remaining > 0;

    wrapper.innerHTML = `
      <div style="display: flex; justify-content: center; gap: 40px; margin-bottom: 20px;">
        <div>
          <p style="color: var(--ink-dim); font-size: 0.85rem; margin-bottom: 4px;">Their Roll</p>
          <div style="font-size: 2rem; background: var(--parchment-light); border: 2px solid var(--accent); border-radius: 8px; width: 56px; height: 56px; display: flex; align-items: center; justify-content: center; margin: 0 auto; font-family: var(--font-display); color: var(--accent-bright);">
            ${this.customerRoll}
          </div>
        </div>
        <div>
          <p style="color: var(--ink-dim); font-size: 0.85rem; margin-bottom: 4px;">Your Total</p>
          <div style="font-size: 2rem; background: var(--parchment-light); border: 2px solid ${canWin ? 'var(--gold-dim)' : 'var(--green)'}; border-radius: 8px; width: 56px; height: 56px; display: flex; align-items: center; justify-content: center; margin: 0 auto; font-family: var(--font-display); color: ${canWin ? 'var(--gold)' : 'var(--green-bright)'};">
            ${this.playerTotal}
          </div>
        </div>
      </div>

      ${this.playerRolls.length > 0 ? `
        <div style="margin-bottom: 16px; display: flex; gap: 6px; justify-content: center; flex-wrap: wrap;">
          ${this.playerRolls.map(r => `
            <span style="display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; background: var(--parchment-light); border: 1px solid var(--parchment-lighter); border-radius: 4px; font-size: 0.9rem; font-family: var(--font-display);">
              ${r}
            </span>
          `).join('')}
        </div>
      ` : ''}

      ${canWin ? `
        <p style="color: var(--ink-dim); font-size: 0.9rem; margin-bottom: 16px;">
          Need <strong style="color: var(--gold);">${remaining}</strong> more to beat them. Risk a roll or settle now?
        </p>
      ` : `
        <p style="color: var(--green-bright); font-size: 0.9rem; margin-bottom: 16px; font-family: var(--font-display);">
          You beat their roll! Claim your great deal!
        </p>
      `}

      <div style="display: flex; flex-direction: ${canWin ? 'column' : 'row'}; align-items: center; gap: 12px; justify-content: center;">
        ${canWin ? `
          <button class="btn btn-gold" data-action="roll" style="min-width: 10rem; margin-bottom: 8px;">🎲 Roll d6</button>
          <button class="btn btn-subtle" data-action="settle">🤝 Settle</button>
        ` : `
          <button class="btn btn-gold" data-action="claim">🪙 Claim Great Deal!</button>
        `}
      </div>
    `;

    this.container.appendChild(wrapper);

    wrapper.querySelector('[data-action="roll"]')?.addEventListener('click', () => this.doPlayerRoll());
    wrapper.querySelector('[data-action="settle"]')?.addEventListener('click', () => this.settle());
    wrapper.querySelector('[data-action="claim"]')?.addEventListener('click', () => this.win());
  }

  doPlayerRoll(): void {
    soundManager.play('haggle_roll');
    const roll = Math.floor(Math.random() * 6) + 1;
    this.playerRolls.push(roll);

    if (roll === 1) {
      this.bust(roll);
      return;
    }

    this.playerTotal += roll;

    if (this.playerTotal >= this.customerRoll) {
      this.win();
    } else {
      this.renderPlayerTurn();
    }
  }

  private bust(finalRoll: number): void {
    soundManager.play('haggle_bust');
    this.outcome = 'bust';
    this.phase = 'result';
    this.showResult(finalRoll);
  }

  private settle(): void {
    soundManager.play('haggle_settle');
    this.outcome = 'settle';
    this.phase = 'result';
    this.showResult(null);
  }

  private win(): void {
    soundManager.play('haggle_win');
    this.outcome = 'win';
    this.phase = 'result';
    this.showResult(null);
  }

  private showResult(_bustRoll: number | null): void {
    if (!this.container) return;
    this.container.innerHTML = '';

    let title: string;
    let titleColor: string;
    let explanation: string;
    let multiplier: number;

    if (this.outcome === 'win') {
      title = 'Great Deal!';
      titleColor = 'var(--green-bright)';
      explanation = `Your total of ${this.playerTotal} beat their ${this.customerRoll}!`;
      multiplier = 1.5;
    } else if (this.outcome === 'settle') {
      const closeness = this.customerRoll > 1
        ? Math.min(this.playerTotal / (this.customerRoll - 1), 1)
        : 0;
      multiplier = 1.0 + closeness * 0.25;
      title = 'Fair Deal';
      titleColor = 'var(--gold)';
      if (this.playerTotal > 0) {
        const bonus = multiplier > 1.01 ? ` (x${multiplier.toFixed(2)})` : '';
        explanation = `You settled at ${this.playerTotal} vs their ${this.customerRoll}.${bonus}`;
      } else {
        explanation = `You accepted the standard price. A fair deal.`;
      }
    } else {
      title = 'Busted!';
      titleColor = 'var(--accent-bright)';
      explanation = `You rolled a 1! The customer saw your desperation.`;
      multiplier = 0.65 + Math.random() * 0.2;
    }

    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'text-align: center; padding: 16px;';

    wrapper.innerHTML = `
      <p style="font-family: var(--font-display); color: ${titleColor}; font-size: 1.4rem; margin-bottom: 16px;">
        ${title}
      </p>

      <div style="margin-bottom: 16px; display: flex; gap: 6px; justify-content: center; flex-wrap: wrap;">
        ${this.playerRolls.map((r, i) => `
          <span style="display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; background: var(--parchment-light); border: 2px solid ${r === 1 && i === this.playerRolls.length - 1 && this.outcome === 'bust' ? 'var(--accent-bright)' : 'var(--parchment-lighter)'}; border-radius: 4px; font-size: 1rem; font-family: var(--font-display); color: ${r === 1 && i === this.playerRolls.length - 1 && this.outcome === 'bust' ? 'var(--accent-bright)' : 'var(--ink)'};">
            ${r}
          </span>
        `).join('')}
      </div>

      <p style="color: var(--ink); margin-bottom: 8px;">${explanation}</p>
      <p style="color: ${titleColor}; font-size: 1.1rem; font-family: var(--font-display); margin-bottom: 12px;">
        Price multiplier: x${multiplier.toFixed(2)}
      </p>

      <p style="color: var(--green-bright, #4ade80); font-size: 0.9rem; margin-bottom: 20px;">
        ⭐+${calculateReputationGain(this.itemQuality, this.outcome === 'win')} ${this.customer.type.charAt(0).toUpperCase() + this.customer.type.slice(1)} Reputation
      </p>

      <button class="btn btn-gold done-btn">Accept Deal</button>
    `;

    this.container.appendChild(wrapper);

    wrapper.querySelector('.done-btn')!.addEventListener('click', () => {
      const won = this.outcome === 'win';
      const result: MinigameResult = {
        score: won ? 100 : this.outcome === 'settle' ? 50 : 0,
        quality: 0,
        multiplier,
        completed: true,
      };
      if (this.onComplete) this.onComplete(result);
    });
  }

  destroy(): void {
    if (this.container) this.container.innerHTML = '';
  }

  getState() {
    return {
      customerRoll: this.customerRoll,
      playerTotal: this.playerTotal,
      playerRolls: [...this.playerRolls],
      phase: this.phase,
      outcome: this.outcome,
    };
  }
}
