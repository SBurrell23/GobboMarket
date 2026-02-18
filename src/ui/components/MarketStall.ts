import { eventBus } from '../../core/EventBus.js';
import { gameState, type InventoryItem } from '../../core/GameState.js';
import { customerQueue } from '../../market/CustomerQueue.js';
import type { Customer } from '../../market/Customer.js';
import { getGoodsById, getCraftableGoods, getBuyableGoods, type GoodsDefinition } from '../../market/Goods.js';
import { calculateBuyPrice, calculateSellPrice } from '../../market/PricingEngine.js';
import { QUALITY_LABELS } from '../../core/constants.js';
import { ForgeGame } from '../../minigames/ForgeGame.js';
import { HaggleGame } from '../../minigames/HaggleGame.js';
import { AppraisalGame } from '../../minigames/AppraisalGame.js';
import { RuneCraftGame } from '../../minigames/RuneCraftGame.js';
import { awardReputation } from '../../progression/Reputation.js';
import { checkMilestones } from '../../progression/Milestones.js';
import { showTooltip, hideTooltip } from './Tooltip.js';

export class MarketStall {
  private el: HTMLElement;
  private supplierEl: HTMLElement;
  private stallEl: HTMLElement;
  private customerEl: HTMLElement;
  private overlayEl: HTMLElement;
  private minigameContainer: HTMLElement;
  private hasAnimatedEntrance = false;

  // Persistent DOM references for diff-based customer rendering
  private customerPanel: HTMLElement | null = null;
  private customerList: HTMLElement | null = null;
  private customerEmptyMsg: HTMLElement | null = null;
  private customerCardMap = new Map<string, HTMLElement>();
  private patienceBars: { bar: HTMLElement; customer: Customer }[] = [];

  constructor(parent: HTMLElement) {
    this.el = document.createElement('div');
    this.el.className = 'market-layout';

    // Left sidebar: suppliers
    this.supplierEl = document.createElement('div');
    this.supplierEl.className = 'market-layout__sidebar';

    // Center: stall / inventory
    this.stallEl = document.createElement('div');
    this.stallEl.className = 'market-layout__center';

    // Right sidebar: customers
    this.customerEl = document.createElement('div');
    this.customerEl.className = 'market-layout__sidebar';

    this.el.appendChild(this.supplierEl);
    this.el.appendChild(this.stallEl);
    this.el.appendChild(this.customerEl);

    // Minigame overlay
    this.overlayEl = document.createElement('div');
    this.overlayEl.className = 'minigame-overlay';
    this.minigameContainer = document.createElement('div');
    this.minigameContainer.className = 'minigame-container';
    this.overlayEl.appendChild(this.minigameContainer);
    document.body.appendChild(this.overlayEl);

    parent.appendChild(this.el);

    this.render();

    eventBus.on('inventory:changed', () => this.renderStall());
    eventBus.on('customer:arrived', () => this.renderCustomers());
    eventBus.on('customer:left', () => this.renderCustomers());
    eventBus.on('tier:unlocked', () => this.render());
    eventBus.on('coins:changed', () => this.renderSuppliers());
    eventBus.on('stall:upgraded', () => this.renderStall());
    eventBus.on('recipe:unlocked', () => this.renderSuppliers());
    eventBus.on('upgrade:purchased', () => this.renderSuppliers());
  }

  render(): void {
    this.renderSuppliers();
    this.renderStall();
    this.renderCustomers();
    this.hasAnimatedEntrance = true;
  }

  private renderSuppliers(): void {
    this.supplierEl.innerHTML = '';

    // Craftable goods section
    const craftPanel = document.createElement('div');
    craftPanel.className = 'panel';
    craftPanel.innerHTML = `<div class="panel-header"><h3>⚒️ Forge & Craft</h3></div>`;
    const craftGrid = document.createElement('div');
    craftGrid.className = `goods-grid${!this.hasAnimatedEntrance ? ' anim-entrance' : ''}`;

    const craftable = getCraftableGoods(gameState.currentTier, [...gameState.data.unlockedRecipes]);
    for (const goods of craftable) {
      const cost = calculateBuyPrice(goods.id, gameState.currentTier);
      const canAfford = gameState.coins >= cost;
      const hasSpace = gameState.inventory.length < gameState.stallSlots;

      const card = document.createElement('div');
      card.className = 'goods-card';
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', `Craft ${goods.name} for ${cost} gold`);
      card.style.opacity = canAfford && hasSpace ? '1' : '0.5';
      card.innerHTML = `
        <div class="goods-card__icon">${goods.icon}</div>
        <div class="goods-card__name">${goods.name}</div>
        <div class="goods-card__price">${cost} 🪙</div>
      `;

      if (canAfford && hasSpace) {
        card.addEventListener('click', () => this.startCrafting(goods));
      }

      card.addEventListener('mouseenter', () => {
        showTooltip(card, `
          <strong style="color: var(--gold)">${goods.name}</strong><br>
          ${goods.description}<br>
          Material cost: ${cost} 🪙<br>
          ${!canAfford ? '<span style="color: var(--accent-bright)">Not enough gold!</span>' : ''}
          ${!hasSpace ? '<span style="color: var(--accent-bright)">Stall full!</span>' : ''}
        `);
      });
      card.addEventListener('mouseleave', hideTooltip);

      craftGrid.appendChild(card);
    }
    craftPanel.appendChild(craftGrid);
    this.supplierEl.appendChild(craftPanel);

    // Buyable goods section (no crafting needed)
    const buyPanel = document.createElement('div');
    buyPanel.className = 'panel';
    buyPanel.innerHTML = `<div class="panel-header"><h3>🏪 Buy Goods</h3></div>`;
    const buyGrid = document.createElement('div');
    buyGrid.className = `goods-grid${!this.hasAnimatedEntrance ? ' anim-entrance' : ''}`;

    const buyable = getBuyableGoods(gameState.currentTier);
    for (const goods of buyable) {
      const cost = calculateBuyPrice(goods.id, gameState.currentTier);
      const canAfford = gameState.coins >= cost;
      const hasSpace = gameState.inventory.length < gameState.stallSlots;

      const card = document.createElement('div');
      card.className = 'goods-card';
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', `Buy ${goods.name} for ${cost} gold`);
      card.style.opacity = canAfford && hasSpace ? '1' : '0.5';
      card.innerHTML = `
        <div class="goods-card__icon">${goods.icon}</div>
        <div class="goods-card__name">${goods.name}</div>
        <div class="goods-card__price">${cost} 🪙</div>
      `;

      if (canAfford && hasSpace) {
        card.addEventListener('click', () => this.buyGoods(goods));
      }

      card.addEventListener('mouseenter', () => {
        showTooltip(card, `
          <strong style="color: var(--gold)">${goods.name}</strong><br>
          ${goods.description}<br>
          Cost: ${cost} 🪙
        `);
      });
      card.addEventListener('mouseleave', hideTooltip);

      buyGrid.appendChild(card);
    }
    buyPanel.appendChild(buyGrid);
    this.supplierEl.appendChild(buyPanel);
  }

  private renderStall(): void {
    this.stallEl.innerHTML = '';

    const panel = document.createElement('div');
    panel.className = 'panel';
    panel.innerHTML = `
      <div class="panel-header">
        <h3>🏪 Your Stall <span style="font-size: 0.8rem; color: var(--ink-dim);">(${gameState.inventory.length}/${gameState.stallSlots} slots)</span></h3>
      </div>
    `;

    const grid = document.createElement('div');
    grid.className = `goods-grid${!this.hasAnimatedEntrance ? ' anim-entrance' : ''}`;

    if (gameState.inventory.length === 0) {
      grid.innerHTML = '<p style="color: var(--ink-dim); font-size: 0.85rem; grid-column: 1/-1; padding: 20px; text-align: center;">Your stall is empty. Craft or buy some goods to sell!</p>';
    } else {
      for (const item of gameState.inventory) {
        const goods = getGoodsById(item.goodsId);
        if (!goods) continue;

        const qualityLabel = QUALITY_LABELS[Math.min(item.quality, QUALITY_LABELS.length - 1)];
        const card = document.createElement('div');
        card.className = `goods-card${item.enchanted ? ' goods-card--enchanted' : ''}`;
        card.innerHTML = `
          <div class="goods-card__icon">${goods.icon}</div>
          <div class="goods-card__name">${goods.name}</div>
          <div class="goods-card__quality" style="color: ${item.quality >= 3 ? 'var(--gold)' : item.quality >= 2 ? 'var(--green-bright)' : 'var(--ink-dim)'}">${qualityLabel}</div>
          ${item.enchanted ? '<div style="color: var(--blue-bright); font-size: 0.75rem;">✨ Enchanted x' + item.enchantMultiplier.toFixed(1) + '</div>' : ''}
          <div class="goods-card__price">~${Math.round(item.basePrice * (item.enchanted ? item.enchantMultiplier : 1))} 🪙</div>
        `;

        // Enchant button if not already enchanted
        if (!item.enchanted) {
          const enchantBtn = document.createElement('button');
          enchantBtn.className = 'btn btn-subtle';
          enchantBtn.style.cssText = 'font-size: 0.75rem; padding: 2px 8px; margin-top: 4px;';
          enchantBtn.textContent = '✨ Enchant';
          enchantBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.startEnchanting(item);
          });
          card.appendChild(enchantBtn);
        }

        card.addEventListener('mouseenter', () => {
          showTooltip(card, `
            <strong style="color: var(--gold)">${goods.name}</strong><br>
            Quality: ${qualityLabel}<br>
            ${item.enchanted ? `Enchanted: x${item.enchantMultiplier.toFixed(1)}<br>` : ''}
            Click a customer to sell this item.
          `);
        });
        card.addEventListener('mouseleave', hideTooltip);

        grid.appendChild(card);
      }
    }

    panel.appendChild(grid);
    this.stallEl.appendChild(panel);
  }

  private customerTimerInterval: ReturnType<typeof setInterval> | null = null;

  private renderCustomers(): void {
    // First-time setup: create the persistent panel + list structure
    if (!this.customerPanel) {
      this.customerEl.innerHTML = '';
      this.customerPanel = document.createElement('div');
      this.customerPanel.className = 'panel';
      this.customerPanel.innerHTML = `<div class="panel-header"><h3>👥 Customers</h3></div>`;

      this.customerList = document.createElement('div');
      this.customerList.className = 'customer-queue';
      this.customerPanel.appendChild(this.customerList);

      this.customerEmptyMsg = document.createElement('p');
      this.customerEmptyMsg.style.cssText = 'color: var(--ink-dim); font-size: 0.85rem; padding: 12px; text-align: center;';
      this.customerEmptyMsg.textContent = "No customers yet. They'll arrive soon!";
      this.customerPanel.appendChild(this.customerEmptyMsg);

      this.customerEl.appendChild(this.customerPanel);

      // Start patience bar ticker once
      if (!this.customerTimerInterval) {
        this.customerTimerInterval = setInterval(() => this.updatePatienceBars(), 1000);
      }
    }

    const queue = customerQueue.customers;
    const currentIds = new Set(queue.map(c => c.id));

    // Remove cards for customers who left
    for (const [id, card] of this.customerCardMap) {
      if (!currentIds.has(id)) {
        card.style.opacity = '0';
        card.style.transform = 'translateX(20px)';
        card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        setTimeout(() => card.remove(), 300);
        this.customerCardMap.delete(id);
        this.patienceBars = this.patienceBars.filter(pb => pb.customer.id !== id);
      }
    }

    // Add cards for new customers
    for (const customer of queue) {
      if (this.customerCardMap.has(customer.id)) continue;

      const card = this.createCustomerCard(customer);
      this.customerList!.appendChild(card);
      this.customerCardMap.set(customer.id, card);
    }

    // Toggle empty message
    this.customerEmptyMsg!.style.display = queue.length === 0 ? '' : 'none';
    this.customerList!.style.display = queue.length === 0 ? 'none' : '';

    // Run patience bars immediately
    this.updatePatienceBars();
  }

  private createCustomerCard(customer: Customer): HTMLElement {
    const card = document.createElement('div');
    card.className = 'customer-card anim-slide-up';
    card.dataset.customerId = customer.id;
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `Sell to ${customer.name} the ${customer.type}, wants ${customer.desiredCategory}`);

    const haggleLabel = customer.haggleSkill < 0.33 ? 'Poor Haggler'
      : customer.haggleSkill < 0.66 ? 'Moderate Haggler'
      : 'Tough Haggler';
    const haggleColor = customer.haggleSkill < 0.33 ? 'var(--green-bright, #4ade80)'
      : customer.haggleSkill < 0.66 ? 'var(--gold-dim)'
      : 'var(--accent-bright)';

    card.innerHTML = `
      <div class="customer-card__icon">${customer.icon}</div>
      <div class="customer-card__info">
        <div class="customer-card__name">${customer.name}</div>
        <div class="customer-card__desire">Wants: <span style="text-transform: uppercase; color: var(--gold); font-family: var(--font-display); letter-spacing: 0.5px;">${customer.desiredCategory}</span></div>
        <div style="font-size: 0.75rem; color: ${haggleColor};">🎲 ${haggleLabel}</div>
        <div class="patience-bar" style="margin-top: 4px; height: 3px; background: var(--parchment-lighter); border-radius: 2px; overflow: hidden;">
          <div class="patience-bar__fill" style="height: 100%; background: var(--gold-dim); border-radius: 2px; transition: width 1s linear; width: 100%;"></div>
        </div>
      </div>
      <div style="color: var(--gold-dim); font-size: 0.8rem; align-self: center;">Sell ➜</div>
    `;

    card.style.cursor = 'pointer';
    card.addEventListener('click', () => {
      this.startSale(customer);
    });

    card.addEventListener('mouseenter', () => {
      showTooltip(card, `
        <strong style="color: var(--gold)">${customer.name}</strong> the ${customer.type}<br>
        Wants: <span style="text-transform: uppercase; color: var(--gold);">${customer.desiredCategory}</span><br>
        Haggle skill: ${Math.round(customer.haggleSkill * 100)}%<br>
        Budget: ${customer.budgetMultiplier > 1 ? 'Generous' : customer.budgetMultiplier < 1 ? 'Cheap' : 'Normal'}
      `);
    });
    card.addEventListener('mouseleave', hideTooltip);

    const patienceBar = card.querySelector('.patience-bar__fill') as HTMLElement;
    if (patienceBar) {
      this.patienceBars.push({ bar: patienceBar, customer });
    }

    return card;
  }

  private updatePatienceBars(): void {
    const now = Date.now();
    for (const { bar, customer } of this.patienceBars) {
      const totalMs = customer.patience * 10000;
      const elapsed = now - customer.arrivedAt;
      const remaining = Math.max(0, 1 - elapsed / totalMs);
      bar.style.width = `${remaining * 100}%`;
      if (remaining < 0.3) {
        bar.style.background = 'var(--accent-bright)';
      } else if (remaining < 0.6) {
        bar.style.background = 'var(--gold)';
      }
    }
  }

  private startCrafting(goods: GoodsDefinition): void {
    const cost = calculateBuyPrice(goods.id, gameState.currentTier);
    if (!gameState.spendCoins(cost, goods.name)) return;

    eventBus.emit('minigame:started', { type: 'forge' });
    this.showOverlay();

    this.minigameContainer.innerHTML = `<h2 class="minigame-container__title">⚒️ Forging: ${goods.name}</h2><div id="forge-area"></div>`;

    const forge = new ForgeGame(gameState.currentTier);
    forge.onComplete = (result) => {
      forge.destroy();
      eventBus.emit('minigame:completed', { type: 'forge', score: result.score });

      // Arcane Anvil: 25% chance forged items start enchanted
      const arcaneProc = gameState.hasUpgrade('arcane_anvil') && Math.random() < 0.25;
      const item: InventoryItem = {
        id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        goodsId: goods.id,
        quality: result.quality,
        enchanted: arcaneProc,
        enchantMultiplier: arcaneProc ? 1.3 : 1,
        basePrice: goods.basePrice,
      };

      gameState.addToInventory(item);
      gameState.recordCraft();

      this.hideOverlay();
      this.render();
      checkMilestones();
    };

    forge.start(this.minigameContainer.querySelector('#forge-area')!);
  }


  private buyGoods(goods: GoodsDefinition): void {
    const cost = calculateBuyPrice(goods.id, gameState.currentTier);
    if (!gameState.spendCoins(cost, goods.name)) return;

    // Appraisal minigame for bought goods
    eventBus.emit('minigame:started', { type: 'appraisal' });
    this.showOverlay();

    this.minigameContainer.innerHTML = `<h2 class="minigame-container__title">🔍 Appraising: ${goods.name}</h2><div id="appraisal-area"></div>`;

    const appraisal = new AppraisalGame(gameState.currentTier);
    appraisal.onComplete = (result) => {
      appraisal.destroy();
      eventBus.emit('minigame:completed', { type: 'appraisal', score: result.score });

      const item: InventoryItem = {
        id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        goodsId: goods.id,
        quality: result.quality,
        enchanted: false,
        enchantMultiplier: 1,
        basePrice: goods.basePrice,
      };

      gameState.addToInventory(item);
      this.hideOverlay();
      this.render();
      checkMilestones();
    };

    appraisal.start(this.minigameContainer.querySelector('#appraisal-area')!);
  }

  private startEnchanting(item: InventoryItem): void {
    eventBus.emit('minigame:started', { type: 'runecraft' });
    this.showOverlay();

    const goods = getGoodsById(item.goodsId);
    this.minigameContainer.innerHTML = `<h2 class="minigame-container__title">✨ Enchanting: ${goods?.name ?? 'Item'}</h2><div id="runecraft-area"></div>`;

    const rune = new RuneCraftGame(gameState.currentTier);
    rune.onComplete = (result) => {
      rune.destroy();
      eventBus.emit('minigame:completed', { type: 'runecraft', score: result.score });

      if (result.multiplier > 1) {
        item.enchanted = true;
        item.enchantMultiplier = result.multiplier;
        eventBus.emit('inventory:changed', {});
      }

      this.hideOverlay();
      this.render();
    };

    rune.start(this.minigameContainer.querySelector('#runecraft-area')!);
  }

  private startSale(customer: Customer): void {
    this.showOverlay();

    if (gameState.inventory.length === 0) {
      this.minigameContainer.innerHTML = `
        <div style="text-align: center; padding: 24px;">
          <p style="font-family: var(--font-display); color: var(--gold); font-size: 1.1rem; margin-bottom: 16px;">
            ${customer.icon} ${customer.name} is browsing...
          </p>
          <p style="color: var(--ink-dim); margin-bottom: 20px;">You have no items to sell! Buy or craft some goods first.</p>
          <button class="btn btn-gold close-btn">Back to Market</button>
        </div>
      `;
      this.minigameContainer.querySelector('.close-btn')!.addEventListener('click', () => this.hideOverlay());
      return;
    }

    this.minigameContainer.innerHTML = `
      <h2 class="minigame-container__title">Select an item to sell to ${customer.icon} ${customer.name}</h2>
      <div class="goods-grid" id="sale-items"></div>
    `;

    const grid = this.minigameContainer.querySelector('#sale-items')!;
    for (const item of gameState.inventory) {
      const goods = getGoodsById(item.goodsId);
      if (!goods) continue;

      const priceCalc = calculateSellPrice(item, customer);
      const qualityLabel = QUALITY_LABELS[Math.min(item.quality, QUALITY_LABELS.length - 1)];
      const isDesired = customer.desiredCategory === goods.category;

      const card = document.createElement('div');
      card.className = 'goods-card';
      card.style.border = isDesired ? '2px solid var(--gold-dim)' : '';
      card.innerHTML = `
        <div class="goods-card__icon">${goods.icon}</div>
        <div class="goods-card__name">${goods.name}</div>
        <div class="goods-card__quality">${qualityLabel}</div>
        <div class="goods-card__price">~${priceCalc.finalPrice} 🪙</div>
        ${isDesired ? '<div style="color: var(--gold); font-size: 0.7rem;">★ Desired!</div>' : ''}
      `;

      card.addEventListener('click', () => {
        this.doHaggle(customer, item);
      });

      grid.appendChild(card);
    }

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn-subtle';
    cancelBtn.style.marginTop = '16px';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => {
      this.hideOverlay();
    });
    this.minigameContainer.appendChild(cancelBtn);
  }

  private doHaggle(customer: Customer, item: InventoryItem): void {
    eventBus.emit('minigame:started', { type: 'haggle' });

    this.minigameContainer.innerHTML = `<h2 class="minigame-container__title">🎲 Haggling with ${customer.icon} ${customer.name}</h2><div id="haggle-area"></div>`;

    const haggle = new HaggleGame(customer);
    haggle.onComplete = (result) => {
      haggle.destroy();
      eventBus.emit('minigame:completed', { type: 'haggle', score: result.score });

      const priceCalc = calculateSellPrice(item, customer, result.multiplier);
      const won = result.multiplier >= 1.0;

      gameState.removeFromInventory(item.id);
      gameState.addCoins(priceCalc.finalPrice, `sale:${item.goodsId}`);
      gameState.recordSale();
      gameState.recordHaggle(won);
      awardReputation(item.quality, won);

      customerQueue.removeCustomer(customer.id);
      eventBus.emit('item:sold', { itemId: item.id, price: priceCalc.finalPrice, customerId: customer.id });
      eventBus.emit('customer:left', { customerId: customer.id, satisfied: true });

      this.hideOverlay();
      this.render();
      this.showSaleToast(priceCalc.finalPrice);
      this.showNewMilestones();
    };

    haggle.start(this.minigameContainer.querySelector('#haggle-area')!);
  }

  private showNewMilestones(): void {
    const milestones = checkMilestones();
    if (milestones.length === 0) return;

    this.showOverlay();
    this.minigameContainer.innerHTML = `
      <div style="text-align: center; padding: 24px;">
        <h2 style="margin-bottom: 16px;">🏆 Milestone${milestones.length > 1 ? 's' : ''} Reached!</h2>
        ${milestones.map(m => `
          <div style="margin-bottom: 12px; padding: 12px; background: var(--parchment-light); border-radius: 8px; border: 1px solid var(--gold-dim);">
            <span style="font-size: 1.5rem;">${m.icon}</span>
            <p style="color: var(--gold); font-family: var(--font-display); font-size: 1.1rem;">${m.name}</p>
            <p style="color: var(--ink-dim); font-size: 0.85rem;">${m.description}</p>
          </div>
        `).join('')}
        <button class="btn btn-gold close-btn" style="margin-top: 12px;">Continue</button>
      </div>
    `;

    this.minigameContainer.querySelector('.close-btn')!.addEventListener('click', () => {
      this.hideOverlay();

      if (gameState.hasMaxCoins) {
        this.showVictory();
      }
    });
  }

  private showVictory(): void {
    this.showOverlay();
    this.minigameContainer.innerHTML = `
      <div style="text-align: center; padding: 32px;">
        <div style="font-size: 4rem; margin-bottom: 16px;">👑🪙👑</div>
        <h1 style="margin-bottom: 12px; font-size: 2rem;">Goblin Tycoon!</h1>
        <p style="color: var(--gold); font-size: 1.2rem; margin-bottom: 8px;">
          You've amassed 1,000,000 gold coins!
        </p>
        <p style="color: var(--ink); margin-bottom: 24px;">
          From a muddy alley stall to the Grand Exchange, you've become the greatest merchant the realm has ever known.
        </p>
        <p style="color: var(--ink-dim); margin-bottom: 8px;">
          Items crafted: ${gameState.data.itemsCrafted} | Items sold: ${gameState.data.itemsSold}
        </p>
        <p style="color: var(--ink-dim); margin-bottom: 24px;">
          Haggle wins: ${gameState.data.haggleWins} | Total earned: ${gameState.data.totalEarned.toLocaleString()} 🪙
        </p>
        <button class="btn btn-gold close-btn">Continue Playing</button>
      </div>
    `;

    this.minigameContainer.querySelector('.close-btn')!.addEventListener('click', () => {
      this.hideOverlay();
    });
  }

  private showSaleToast(amount: number): void {
    const toast = document.createElement('div');
    toast.className = 'sale-toast';
    toast.textContent = `+${amount.toLocaleString()} 🪙`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2750);
  }

  private showOverlay(): void {
    hideTooltip();
    this.overlayEl.classList.add('active');
  }

  private hideOverlay(): void {
    this.overlayEl.classList.add('closing');
    this.overlayEl.classList.remove('active');
    this.minigameContainer.innerHTML = '';
    requestAnimationFrame(() => {
      this.overlayEl.classList.remove('closing');
    });
  }

  get element(): HTMLElement {
    return this.el;
  }
}
