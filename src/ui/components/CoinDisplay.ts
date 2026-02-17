import { eventBus } from '../../core/EventBus.js';
import { gameState } from '../../core/GameState.js';

export class CoinDisplay {
  private el: HTMLElement;
  private amountEl: HTMLElement;
  private particleContainer: HTMLElement;

  constructor(parent: HTMLElement) {
    this.el = document.createElement('div');
    this.el.className = 'coin-display';
    this.el.innerHTML = `
      <span class="coin-display__icon">🪙</span>
      <span class="coin-display__amount">0</span>
    `;
    this.el.style.cssText = `
      display: flex;
      align-items: center;
      gap: 6px;
      font-family: var(--font-display);
      font-size: 1.2rem;
      color: var(--gold);
    `;
    parent.appendChild(this.el);

    this.amountEl = this.el.querySelector('.coin-display__amount')!;
    this.particleContainer = document.createElement('div');
    this.particleContainer.style.cssText = 'position: relative; display: inline-block;';
    this.amountEl.parentNode!.insertBefore(this.particleContainer, this.amountEl);
    this.particleContainer.appendChild(this.amountEl);

    this.update();
    eventBus.on('coins:changed', () => this.update());
    eventBus.on('coins:earned', (data) => this.showParticle(data.amount));
  }

  private update(): void {
    this.amountEl.textContent = gameState.coins.toLocaleString();
  }

  private showParticle(amount: number): void {
    const particle = document.createElement('span');
    particle.className = 'coin-particle';
    particle.textContent = `+${amount}`;
    particle.style.left = '50%';
    particle.style.bottom = '100%';
    this.particleContainer.appendChild(particle);
    this.amountEl.classList.add('anim-coin-burst');

    setTimeout(() => {
      particle.remove();
      this.amountEl.classList.remove('anim-coin-burst');
    }, 1000);
  }

  get element(): HTMLElement {
    return this.el;
  }
}
