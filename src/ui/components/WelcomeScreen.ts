import { saveSystem } from '../../core/SaveSystem.js';
import { restoreScrollPositions, saveScrollPositions } from '../scrollPreserve.js';
import { showSettingsModal } from './SettingsModal.js';

function formatLastSaved(timestamp: number): string {
  if (!timestamp) return 'Unknown';
  const sec = Math.floor((Date.now() - timestamp) / 1000);
  if (sec < 60) return 'Just now';
  if (sec < 3600) return `${Math.floor(sec / 60)} min ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} hr ago`;
  return `${Math.floor(sec / 86400)} days ago`;
}

export class WelcomeScreen {
  private el: HTMLElement;
  private onStart: () => void;

  constructor(parent: HTMLElement, onStart: () => void) {
    this.onStart = onStart;
    this.el = document.createElement('div');
    this.el.style.cssText = `
      position: fixed; inset: 0; z-index: 500;
      display: flex; align-items: flex-start; justify-content: center;
      padding-top: 12vh;
      background: var(--bg-dark);
    `;

    const hasSave = saveSystem.hasSave();
    const meta = hasSave ? saveSystem.getSaveMetadata() : null;

    this.el.innerHTML = `
      <button class="btn btn-subtle" id="welcome-settings" style="position: fixed; top: 16px; right: 16px; z-index: 501; padding: 4px 10px; font-size: 1rem;" title="Settings">⚙️</button>
      <div class="anim-fade-in" style="text-align: center; max-width: 550px; padding: 24px 32px;">
        <div style="font-size: 4rem; margin-bottom: 12px;">🏪</div>
        <h1 style="font-size: 2.8rem; margin-bottom: 6px; line-height: 1.1;">Gobbo Market</h1>
        <p style="color: var(--ink-dim); font-size: 1.05rem; margin-bottom: 24px; line-height: 1.6;">
          Buy materials. Forge goods. Haggle with customers.<br>
          Rise from a muddy alley stall to the Grand Exchange.
        </p>

        <div style="display: flex; flex-direction: column; gap: 8px; align-items: center;">
          ${hasSave && meta ? `
            <div class="panel" style="width: 100%; max-width: 650px; padding: 0; overflow: hidden;">
              <div style="padding: 20px 24px; border-bottom: 1px solid var(--parchment-lighter);">
                <div style="display: flex; flex-wrap: wrap; gap: 20px 32px; font-size: 0.9rem;">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 1.1rem;">🪙</span>
                    <span style="color: var(--ink-dim);">Gold</span>
                    <span style="color: var(--gold); font-weight: 600;">${meta.coins.toLocaleString()}</span>
                  </div>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 1.1rem;">📍</span>
                    <span style="color: var(--ink-dim);">Market</span>
                    <span style="color: var(--gold); font-weight: 600;">${meta.tierName}</span>
                  </div>
                </div>
                <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--parchment-lighter); display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 0.85rem; color: var(--ink-dim);">
                  <span>💾</span>
                  <span>Last saved ${formatLastSaved(meta.timestamp).toLowerCase()}</span>
                </div>
              </div>
              <div style="padding: 20px 24px;">
                <button class="btn btn-gold" id="welcome-continue" style="font-size: 1.1rem; padding: 12px 24px; width: 100%;">
                  Continue Game
                </button>
              </div>
            </div>
            <button class="btn btn-subtle" id="welcome-new" style="font-size: 0.9rem; padding: 8px 24px; margin-top: 32px;">
              New Game
            </button>
          ` : hasSave ? `
            <button class="btn btn-gold" id="welcome-continue" style="font-size: 1.1rem; padding: 12px 36px;">
              Continue Game
            </button>
            <button class="btn btn-subtle" id="welcome-new" style="font-size: 0.9rem; padding: 8px 24px; margin-top: 32px;">
              New Game
            </button>
          ` : `
            <button class="btn btn-gold" id="welcome-start" style="font-size: 1.1rem; padding: 12px 36px;">
              Open Your Stall
            </button>
          `}
        </div>
      </div>
    `;

    parent.appendChild(this.el);
    this.bindEvents(hasSave);
  }

  private bindEvents(hasSave: boolean): void {
    this.el.querySelector('#welcome-settings')?.addEventListener('click', () => showSettingsModal());

    if (hasSave) {
      this.el.querySelector('#welcome-continue')?.addEventListener('click', () => {
        saveSystem.load();
        this.dismiss();
      });
      this.el.querySelector('#welcome-new')?.addEventListener('click', () => this.showNewGameConfirm());
    } else {
      this.el.querySelector('#welcome-start')?.addEventListener('click', () => {
        this.dismiss();
      });
    }
  }

  private showNewGameConfirm(): void {
    const scrollState = saveScrollPositions();
    const backdrop = document.createElement('div');
    backdrop.style.cssText = `
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.6);
      z-index: 510;
      display: flex; align-items: center; justify-content: center;
    `;

    const panel = document.createElement('div');
    panel.className = 'panel';
    panel.style.cssText = 'min-width: 280px; max-width: 90vw;';

    panel.innerHTML = `
      <div class="panel-header" style="margin-bottom: 16px;">
        <h3 style="margin: 0;">Start New Game?</h3>
      </div>
      <p style="color: var(--ink-dim); margin-bottom: 20px; line-height: 1.5;">
        This will overwrite your current save.
      </p>
      <div style="display: flex; gap: 12px; justify-content: flex-end;">
        <button class="btn btn-subtle" id="new-game-cancel">Cancel</button>
        <button class="btn btn-gold" id="new-game-confirm">Start New Game</button>
      </div>
    `;

    const close = () => {
      backdrop.remove();
      restoreScrollPositions(scrollState);
    };

    panel.querySelector('#new-game-cancel')?.addEventListener('click', close);
    panel.querySelector('#new-game-confirm')?.addEventListener('click', () => {
      close();
      saveSystem.deleteSave();
      this.dismiss();
    });
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) close();
    });

    backdrop.appendChild(panel);
    document.body.appendChild(backdrop);
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
