import { eventBus } from '../../core/EventBus.js';
import { gameState, type InventoryItem } from '../../core/GameState.js';
import { getGoodsById } from '../../market/Goods.js';
import { QUALITY_LABELS } from '../../core/constants.js';
import { showTooltip, hideTooltip } from './Tooltip.js';
import { attachHoverSound } from '../../audio/attachHoverSound.js';

export class Inventory {
  private el: HTMLElement;
  private gridEl: HTMLElement;
  private onItemClick: ((item: InventoryItem) => void) | null = null;

  constructor(parent: HTMLElement) {
    this.el = document.createElement('div');
    this.el.className = 'panel';
    this.el.innerHTML = `
      <div class="panel-header"><h3>Your Stall</h3></div>
      <div class="goods-grid inventory-grid"></div>
    `;
    parent.appendChild(this.el);
    this.gridEl = this.el.querySelector('.inventory-grid')!;

    this.render();
    eventBus.on('inventory:changed', () => this.render());
  }

  setOnItemClick(cb: (item: InventoryItem) => void): void {
    this.onItemClick = cb;
  }

  private render(): void {
    this.gridEl.innerHTML = '';
    const items = gameState.inventory;

    if (items.length === 0) {
      this.gridEl.innerHTML = '<p style="color: var(--ink-dim); font-size: 0.85rem; grid-column: 1/-1;">Your stall is empty. Craft or buy some goods!</p>';
      return;
    }

    for (const item of items) {
      const goods = getGoodsById(item.goodsId);
      if (!goods) continue;

      const card = document.createElement('div');
      card.className = 'goods-card';
      const qualityLabel = QUALITY_LABELS[Math.min(item.quality, QUALITY_LABELS.length - 1)];
      const qualityClasses = ['quality-shoddy', 'quality-passable', 'quality-fine', 'quality-superior', 'quality-masterwork'];
      const qualityClass = qualityClasses[Math.min(item.quality, qualityClasses.length - 1)];

      card.innerHTML = `
        <div class="goods-card__icon">${goods.icon}</div>
        <div class="goods-card__name">${goods.name}</div>
        <div class="goods-card__quality ${qualityClass}">${qualityLabel}</div>
        <div class="goods-card__price">~${Math.round(item.basePrice * (item.enchanted ? item.enchantMultiplier : 1))} 🪙</div>
      `;

      card.addEventListener('click', () => {
        if (this.onItemClick) this.onItemClick(item);
      });

      card.addEventListener('mouseenter', () => {
        const enchantText = item.enchanted ? `<br><span class="enchanted-pink">Enchanted (x${item.enchantMultiplier.toFixed(1)})</span>` : '';
        showTooltip(card, `
          <strong style="color: var(--gold)">${goods.name}</strong><br>
          Quality: ${qualityLabel}${enchantText}<br>
          Base value: ${item.basePrice} 🪙
        `);
      });

      card.addEventListener('mouseleave', hideTooltip);
      attachHoverSound(card);
      this.gridEl.appendChild(card);
    }
  }

  get element(): HTMLElement {
    return this.el;
  }
}
