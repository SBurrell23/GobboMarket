import { saveSystem } from '../../core/SaveSystem.js';

export class WelcomeScreen {
  private el: HTMLElement;
  private onStart: () => void;

  constructor(parent: HTMLElement, onStart: () => void) {
    this.onStart = onStart;
    this.el = document.createElement('div');
    this.el.style.cssText = `
      position: fixed; inset: 0; z-index: 500;
      display: flex; align-items: center; justify-content: center;
      background: var(--bg-dark);
    `;

    const hasSave = saveSystem.hasSave();

    this.el.innerHTML = `
      <div class="anim-fade-in" style="text-align: center; max-width: 550px; padding: 48px 32px;">
        <div style="font-size: 4rem; margin-bottom: 16px;">🏪</div>
        <h1 style="font-size: 2.8rem; margin-bottom: 8px; line-height: 1.1;">Gobbo Market</h1>
        <p style="color: var(--ink-dim); font-size: 1.05rem; margin-bottom: 32px; line-height: 1.6;">
          Buy materials. Forge goods. Haggle with customers.<br>
          Rise from a muddy alley stall to the Grand Exchange.
        </p>

        <div style="display: flex; flex-direction: column; gap: 12px; align-items: center;">
          ${hasSave ? `
            <button class="btn btn-gold" id="welcome-continue" style="font-size: 1.1rem; padding: 12px 36px;">
              Continue Game
            </button>
            <button class="btn btn-subtle" id="welcome-new" style="font-size: 0.9rem; padding: 8px 24px;">
              New Game
            </button>
          ` : `
            <button class="btn btn-gold" id="welcome-start" style="font-size: 1.1rem; padding: 12px 36px;">
              Open Your Stall
            </button>
          `}
        </div>

        <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid var(--parchment-lighter);">
          <h3 style="font-size: 1rem; margin-bottom: 12px;">How to Play</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; text-align: left; font-size: 0.85rem; color: var(--ink-dim);">
            <div><span style="color: var(--gold);">⚒️ Forge</span><br>Time your strikes to craft quality goods</div>
            <div><span style="color: var(--gold);">🎲 Haggle</span><br>Bluff and barter for the best prices</div>
            <div><span style="color: var(--gold);">🔍 Appraise</span><br>Spot genuine items among fakes</div>
            <div><span style="color: var(--gold);">✨ Enchant</span><br>Match rune patterns to add value</div>
          </div>
        </div>
      </div>
    `;

    parent.appendChild(this.el);
    this.bindEvents(hasSave);
  }

  private bindEvents(hasSave: boolean): void {
    if (hasSave) {
      this.el.querySelector('#welcome-continue')?.addEventListener('click', () => {
        saveSystem.load();
        this.dismiss();
      });
      this.el.querySelector('#welcome-new')?.addEventListener('click', () => {
        saveSystem.deleteSave();
        this.dismiss();
      });
    } else {
      this.el.querySelector('#welcome-start')?.addEventListener('click', () => {
        this.dismiss();
      });
    }
  }

  private dismiss(): void {
    this.el.style.opacity = '0';
    this.el.style.transition = 'opacity 0.4s ease';
    setTimeout(() => {
      this.el.remove();
      this.onStart();
    }, 400);
  }
}
