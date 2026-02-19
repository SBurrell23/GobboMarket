import { eventBus } from '../../core/EventBus.js';
import { gameState } from '../../core/GameState.js';
import {
  TIER_NAMES,
  TIER_THRESHOLDS,
  TIER_RACE_REPUTATION_REQUIRED,
  CUSTOMER_ICONS,
} from '../../core/constants.js';
import { showTooltip, hideTooltip } from './Tooltip.js';
import { attachHoverSound } from '../../audio/attachHoverSound.js';

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export class HeaderProgress {
  private container: HTMLElement;

  constructor(parent: HTMLElement) {
    this.container = parent;
    this.container.className = 'game-header__progress';

    this.render();
    eventBus.on('reputation:changed', () => this.render());
    eventBus.on('coins:changed', () => this.render());
    eventBus.on('tier:unlocked', () => this.render());
  }

  private render(): void {
    this.container.innerHTML = '';

    const nextTier = gameState.currentTier + 1;
    if (nextTier >= TIER_NAMES.length) {
      const maxEl = document.createElement('span');
      maxEl.style.cssText = 'font-size: 0.85rem; color: var(--gold-dim);';
      maxEl.textContent = 'Max tier';
      this.container.appendChild(maxEl);
      return;
    }

    const coinThreshold = TIER_THRESHOLDS[nextTier] ?? 0;
    const coins = gameState.coins;
    const coinPct = Math.min(100, (coins / coinThreshold) * 100);
    const coinsMet = coins >= coinThreshold;
    const coinFillColor = coinsMet ? 'var(--green-bright, #4ade80)' : 'var(--gold)';

    const coinItem = this.createProgressItem(
      '🪙',
      coinPct,
      coinFillColor,
      `Coins: ${coins.toLocaleString()} / ${coinThreshold.toLocaleString()}`,
    );
    this.container.appendChild(coinItem);

    const raceReqs = TIER_RACE_REPUTATION_REQUIRED[nextTier] ?? {};
    for (const [race, required] of Object.entries(raceReqs)) {
      const current = gameState.getRaceReputation(race);
      const pct = Math.min(100, (current / required) * 100);
      const met = current >= required;
      const fillColor = met ? 'var(--green-bright, #4ade80)' : 'var(--gold)';
      const icon = CUSTOMER_ICONS[race] ?? '❓';
      const tooltip = `${capitalize(race)}: ${current} / ${required}`;

      const item = this.createProgressItem(icon, pct, fillColor, tooltip);
      this.container.appendChild(item);
    }
  }

  private createProgressItem(
    icon: string,
    pct: number,
    fillColor: string,
    tooltipText: string,
  ): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'game-header__progress-item';

    const iconSpan = document.createElement('span');
    iconSpan.textContent = icon;
    iconSpan.style.fontSize = '1rem';

    const pie = document.createElement('div');
    pie.className = 'game-header__progress-pie';
    const deg = pct * 3.6;
    const bgColor = 'var(--parchment-lighter)';
    pie.style.background = `conic-gradient(${fillColor} 0deg, ${fillColor} ${deg}deg, ${bgColor} ${deg}deg, ${bgColor} 360deg)`;

    wrapper.appendChild(iconSpan);
    wrapper.appendChild(pie);

    wrapper.addEventListener('mouseenter', () => showTooltip(wrapper, tooltipText));
    wrapper.addEventListener('mouseleave', hideTooltip);
    attachHoverSound(wrapper);

    return wrapper;
  }
}
