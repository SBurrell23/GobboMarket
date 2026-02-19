import { eventBus } from '../../core/EventBus.js';
import { gameState } from '../../core/GameState.js';
import { saveSystem } from '../../core/SaveSystem.js';
import { TIER_RACE_REPUTATION_REQUIRED, TIER_THRESHOLDS, CUSTOMER_ICONS } from '../../core/constants.js';
import { getAvailableUpgrades, purchaseUpgrade } from '../../progression/Upgrades.js';
import { getAvailableRecipes, purchaseRecipe } from '../../progression/Recipes.js';
import { getGoodsById } from '../../market/Goods.js';
import { getCompletedMilestones, getAllMilestones } from '../../progression/Milestones.js';
import { getReputationLevel } from '../../progression/Reputation.js';
import { getTierInfo, getAllTiers } from '../../market/MarketTier.js';
import { attachHoverSound } from '../../audio/attachHoverSound.js';
import { soundManager } from '../../audio/SoundManager.js';

export type PanelMode = 'upgrades' | 'progress';

export class UpgradePanel {
  private el: HTMLElement;
  private mode: PanelMode;

  constructor(parent: HTMLElement, mode: PanelMode = 'upgrades') {
    this.mode = mode;
    this.el = document.createElement('div');
    this.el.style.cssText = 'display: flex; flex-direction: column; gap: 16px; padding: 16px 0;';
    parent.appendChild(this.el);

    this.render();
    eventBus.on('coins:changed', () => this.render());
    eventBus.on('upgrade:purchased', () => this.render());
    eventBus.on('recipe:unlocked', () => this.render());
    eventBus.on('tier:unlocked', () => this.render());
    eventBus.on('reputation:changed', () => this.render());
    eventBus.on('milestone:reached', () => this.render());
  }

  render(): void {
    this.el.innerHTML = '';

    if (this.mode === 'upgrades') {
      const cols = document.createElement('div');
      cols.style.cssText = 'display: grid; grid-template-columns: 3fr 2fr; gap: 16px; align-items: start;';
      this.el.appendChild(cols);
      this.renderUpgrades(cols);
      this.renderRecipes(cols);
    } else {
      this.renderStatus();
      const cols = document.createElement('div');
      cols.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr; gap: 16px;';
      this.el.appendChild(cols);
      this.renderTierProgress(cols);
      const rightCol = document.createElement('div');
      rightCol.style.cssText = 'display: flex; flex-direction: column; gap: 16px;';
      cols.appendChild(rightCol);
      this.renderMilestones(rightCol);
      this.renderResetButton();
    }
  }

  private renderStatus(): void {
    const panel = document.createElement('div');
    panel.className = 'panel';
    const tierInfo = getTierInfo(gameState.currentTier);

    const nextTier = gameState.currentTier + 1;
    const hasNext = nextTier < TIER_THRESHOLDS.length;
    let nextTierHtml = '';
    if (hasNext) {
      const coinPct = Math.min(100, (gameState.coins / TIER_THRESHOLDS[nextTier]) * 100);
      const nextName = getTierInfo(nextTier).name;
      const coinsMet = gameState.coins >= TIER_THRESHOLDS[nextTier];
      const coinCheck = coinsMet ? '✅' : '⬜';
      const coinBarColor = coinsMet ? 'var(--green-bright, #4ade80)' : 'var(--gold-dim)';

      const raceReqs = TIER_RACE_REPUTATION_REQUIRED[nextTier] ?? {};
      let raceRepBarsHtml = '';
      for (const [race, req] of Object.entries(raceReqs)) {
        const current = gameState.getRaceReputation(race);
        const pct = Math.min(100, (current / req) * 100);
        const met = current >= req;
        const check = met ? '✅' : '⬜';
        const barColor = met ? 'var(--green-bright, #4ade80)' : 'var(--gold-dim)';
        const icon = CUSTOMER_ICONS[race] ?? '❓';
        raceRepBarsHtml += `
          <div style="margin-bottom: 3px;">
            <div style="display: flex; justify-content: space-between; font-size: 0.78rem; color: var(--ink-dim);">
              <span>${check} ${icon} ${race.charAt(0).toUpperCase() + race.slice(1)}</span>
              <span>${current} / ${req}</span>
            </div>
            <div style="height: 5px; background: var(--parchment-lighter); border-radius: 3px; overflow: hidden; margin-top: 1px;">
              <div style="height: 100%; background: ${barColor}; border-radius: 3px; width: ${pct}%; transition: width 0.3s ease;"></div>
            </div>
          </div>
        `;
      }

      nextTierHtml = `
        <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--parchment-lighter);">
          <div style="font-size: 0.85rem; color: var(--ink-dim); margin-bottom: 4px;">Progress to <span style="color: var(--gold);">${nextName}</span></div>
          <div style="font-size: 0.75rem; color: var(--ink-dim); margin-bottom: 8px; font-style: italic;">All requirements must be met to unlock</div>
          <div style="margin-bottom: 6px;">
            <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--ink-dim);">
              <span>${coinCheck} 🪙 Coins</span>
              <span>${gameState.coins.toLocaleString()} / ${TIER_THRESHOLDS[nextTier].toLocaleString()}</span>
            </div>
            <div style="height: 6px; background: var(--parchment-lighter); border-radius: 3px; overflow: hidden; margin-top: 2px;">
              <div style="height: 100%; background: ${coinBarColor}; border-radius: 3px; width: ${coinPct}%; transition: width 0.3s ease;"></div>
            </div>
          </div>
          <div style="font-size: 0.8rem; color: var(--ink-dim); margin-bottom: 4px;">⭐ Reputation by Race</div>
          ${raceRepBarsHtml}
        </div>
      `;
    }

    panel.innerHTML = `
      <div class="panel-header"><h3>📊 Status</h3></div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.9rem;">
        <div>
          <span style="color: var(--ink-dim);">Tier:</span><br>
          <span style="color: var(--gold); font-family: var(--font-display);">${tierInfo.name}</span>
        </div>
        <div>
          <span style="color: var(--ink-dim);">Reputation:</span><br>
          <span style="color: var(--gold); font-family: var(--font-display);">${getReputationLevel()} (${gameState.reputation})</span>
        </div>
        <div>
          <span style="color: var(--ink-dim);">Items Crafted:</span><br>
          <span>${gameState.data.itemsCrafted}</span>
        </div>
        <div>
          <span style="color: var(--ink-dim);">Items Sold:</span><br>
          <span>${gameState.data.itemsSold}</span>
        </div>
        <div>
          <span style="color: var(--ink-dim);">Haggle Record:</span><br>
          <span style="color: var(--green-bright);">${gameState.data.haggleWins}W</span> /
          <span style="color: var(--accent-bright);">${gameState.data.haggleLosses}L</span>
        </div>
        <div>
          <span style="color: var(--ink-dim);">Total Earned:</span><br>
          <span style="color: var(--gold);">${gameState.data.totalEarned.toLocaleString()} 🪙</span>
        </div>
      </div>
      ${nextTierHtml}
    `;

    this.el.appendChild(panel);
  }

  private renderTierProgress(target: HTMLElement): void {
    const panel = document.createElement('div');
    panel.className = 'panel';
    panel.innerHTML = `<div class="panel-header"><h3>🗺️ Market Tiers</h3></div>`;

    const tiers = getAllTiers();
    const list = document.createElement('div');
    list.style.cssText = 'display: flex; flex-direction: column; gap: 6px;';

    for (const tier of tiers) {
      const isCurrent = tier.tier === gameState.currentTier;
      const isUnlocked = tier.tier <= gameState.currentTier;
      const raceReqs = tier.raceReputationRequired;
      const raceEntries = Object.entries(raceReqs);

      let raceReqHtml = '';
      if (raceEntries.length > 0 && !isUnlocked) {
        const chips = raceEntries.map(([race, req]) => {
          const current = gameState.getRaceReputation(race);
          const met = current >= req;
          const icon = CUSTOMER_ICONS[race] ?? '❓';
          return `<span style="font-size: 0.7rem; color: ${met ? 'var(--green-bright, #4ade80)' : 'var(--ink-dim)'};">${icon}${req}</span>`;
        }).join(' ');
        raceReqHtml = `<div style="margin-top: 2px; display: flex; gap: 4px; flex-wrap: wrap;">${chips}</div>`;
      }

      const item = document.createElement('div');
      item.style.cssText = `
        padding: 8px; border-radius: 4px; font-size: 0.85rem;
        background: ${isCurrent ? 'var(--parchment-light)' : 'transparent'};
        border: 1px solid ${isCurrent ? 'var(--gold-dim)' : 'var(--parchment-lighter)'};
        opacity: ${isUnlocked ? '1' : '0.5'};
      `;
      item.innerHTML = `
        <div style="display: flex; justify-content: space-between;">
          <span style="color: ${isUnlocked ? 'var(--gold)' : 'var(--ink-dim)'}; font-family: var(--font-display);">
            ${isUnlocked ? '✓' : '🔒'} ${tier.name}
          </span>
          <span style="color: var(--ink-dim); font-size: 0.8rem;">
            ${tier.coinThreshold > 0 ? tier.coinThreshold.toLocaleString() + ' 🪙' : 'Start'}
          </span>
        </div>
        ${raceReqHtml}
      `;
      list.appendChild(item);
    }

    panel.appendChild(list);
    target.appendChild(panel);
  }

  private renderUpgrades(target: HTMLElement): void {
    const upgrades = getAvailableUpgrades();

    const panel = document.createElement('div');
    panel.className = 'panel';
    panel.innerHTML = `<div class="panel-header"><h3>⬆️ Upgrades</h3></div>`;

    if (upgrades.length === 0) {
      const empty = document.createElement('p');
      empty.style.cssText = 'color: var(--ink-dim); font-size: 0.85rem; padding: 8px; font-style: italic;';
      empty.textContent = 'No upgrades available right now. Keep progressing!';
      panel.appendChild(empty);
    } else {
      const list = document.createElement('div');
      list.style.cssText = 'display: flex; flex-direction: column; gap: 8px;';

      for (const upgrade of upgrades) {
        const canAfford = gameState.coins >= upgrade.nextCost;
        const rankLabel = upgrade.id === 'wider_stall'
          ? `Slots: ${upgrade.currentRank + 4}`
          : `Rank ${upgrade.currentRank}/${upgrade.maxRank}`;
        const item = document.createElement('div');
        item.style.cssText = `
          display: flex; align-items: center; gap: 8px; padding: 8px;
          background: var(--parchment-light); border-radius: 4px;
          border: 1px solid var(--parchment-lighter);
          opacity: ${canAfford ? '1' : '0.6'};
          cursor: ${canAfford ? 'pointer' : 'default'};
          transition: border-color 0.15s;
        `;
        item.innerHTML = `
          <span style="font-size: 1.3rem;">${upgrade.icon}</span>
          <div style="flex: 1;">
            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
              <span style="color: var(--gold); font-family: var(--font-display); font-size: 0.9rem;">${upgrade.name}</span>
              <span style="
                display: inline-flex; align-items: center; padding: 1px 5px;
                background: linear-gradient(135deg, var(--parchment-lighter) 0%, var(--parchment-light) 100%);
                border: 1px solid var(--gold-dim);
                border-radius: 4px;
                color: var(--gold);
                font-family: var(--font-display);
                font-size: 0.65rem;
                font-weight: 600;
                letter-spacing: 0.02em;
                box-shadow: 0 1px 2px rgba(0,0,0,0.06);
              ">${rankLabel}</span>
            </div>
            <div style="color: var(--ink-dim); font-size: 0.8rem;">${upgrade.description}</div>
          </div>
          <div style="color: ${canAfford ? 'var(--gold)' : 'var(--accent-bright)'}; font-family: var(--font-display); white-space: nowrap;">
            ${upgrade.nextCost.toLocaleString()} 🪙
          </div>
        `;

        if (canAfford) {
          item.addEventListener('mouseenter', () => { item.style.borderColor = 'var(--gold-dim)'; });
          item.addEventListener('mouseleave', () => { item.style.borderColor = 'var(--parchment-lighter)'; });
          item.addEventListener('click', () => {
            soundManager.play('upgrade_click');
            purchaseUpgrade(upgrade.id);
            this.render();
          });
        }
        attachHoverSound(item);

        list.appendChild(item);
      }

      panel.appendChild(list);
    }

    target.appendChild(panel);
  }

  private renderRecipes(target: HTMLElement): void {
    const recipes = getAvailableRecipes().sort((a, b) => a.cost - b.cost);

    const panel = document.createElement('div');
    panel.className = 'panel';
    panel.innerHTML = `<div class="panel-header"><h3>📜 Recipes</h3></div>`;

    if (recipes.length === 0) {
      const empty = document.createElement('p');
      empty.style.cssText = 'color: var(--ink-dim); font-size: 0.85rem; padding: 8px; font-style: italic;';
      empty.textContent = 'No recipes available yet. Unlock more market tiers!';
      panel.appendChild(empty);
    } else {
      const list = document.createElement('div');
      list.style.cssText = 'display: flex; flex-direction: column; gap: 8px;';

      for (const recipe of recipes) {
        const canAfford = gameState.coins >= recipe.cost;
        const item = document.createElement('div');
        item.style.cssText = `
          display: flex; align-items: center; justify-content: space-between; padding: 8px;
          background: var(--parchment-light); border-radius: 4px;
          border: 1px solid var(--parchment-lighter);
          opacity: ${canAfford ? '1' : '0.6'};
          cursor: ${canAfford ? 'pointer' : 'default'};
          transition: border-color 0.15s;
        `;
        const goods = getGoodsById(recipe.goodsId);
        const icon = goods?.icon ?? '📦';
        item.innerHTML = `
          <span style="color: var(--gold); font-family: var(--font-display); font-size: 0.9rem;">${icon} ${recipe.name}</span>
          <span style="color: ${canAfford ? 'var(--gold)' : 'var(--accent-bright)'}; font-family: var(--font-display);">
            ${recipe.cost.toLocaleString()} 🪙
          </span>
        `;

        if (canAfford) {
          item.addEventListener('mouseenter', () => { item.style.borderColor = 'var(--gold-dim)'; });
          item.addEventListener('mouseleave', () => { item.style.borderColor = 'var(--parchment-lighter)'; });
          item.addEventListener('click', () => {
            soundManager.play('upgrade_click');
            purchaseRecipe(recipe.id);
            this.render();
          });
        }
        attachHoverSound(item);

        list.appendChild(item);
      }

      panel.appendChild(list);
    }

    target.appendChild(panel);
  }

  private renderMilestones(target: HTMLElement): void {
    const all = getAllMilestones();
    const completed = getCompletedMilestones();

    const panel = document.createElement('div');
    panel.className = 'panel';
    panel.innerHTML = `<div class="panel-header"><h3>🏆 Milestones (${completed.length}/${all.length})</h3></div>`;

    const grid = document.createElement('div');
    grid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 8px;';

    for (const m of all) {
      const done = completed.some(c => c.id === m.id);
      const card = document.createElement('div');
      card.style.cssText = `
        display: flex; align-items: flex-start; gap: 8px; padding: 8px 10px;
        font-size: 0.85rem; opacity: ${done ? '1' : '0.4'};
        background: ${done ? 'var(--parchment-light)' : 'transparent'};
        border: 1px solid ${done ? 'var(--gold-dim)' : 'var(--parchment-lighter)'};
        border-radius: 4px;
      `;
      card.innerHTML = `
        <span style="flex-shrink: 0; font-size: 1.1rem; line-height: 1.2;">${done ? m.icon : '🔒'}</span>
        <div style="display: flex; flex-direction: column; gap: 2px; min-width: 0;">
          <span style="color: ${done ? 'var(--gold)' : 'var(--ink-dim)'}; font-family: var(--font-display); font-size: 0.85rem;">${m.name}</span>
          <span style="color: var(--ink-dim); font-size: 0.72rem; line-height: 1.3;">${m.description}</span>
        </div>
      `;
      grid.appendChild(card);
    }

    panel.appendChild(grid);
    target.appendChild(panel);
  }

  private renderResetButton(): void {
    const panel = document.createElement('div');
    panel.className = 'panel';
    panel.style.cssText = 'text-align: center; margin-top: 8px;';
    panel.innerHTML = `
      <button class="btn btn-red" id="reset-game-btn" style="font-size: 0.85rem; padding: 6px 16px;">
        🗑️ Reset Game
      </button>
      <p style="color: var(--ink-dim); font-size: 0.75rem; margin-top: 6px;">This will erase all progress.</p>
    `;

    panel.querySelector('#reset-game-btn')!.addEventListener('click', () => {
      const confirmEl = panel.querySelector('#reset-game-btn')! as HTMLElement;
      if (confirmEl.dataset.confirming === 'true') {
        saveSystem.deleteSave();
        gameState.reset();
        window.location.reload();
      } else {
        confirmEl.dataset.confirming = 'true';
        confirmEl.textContent = '⚠️ Click again to confirm';
        confirmEl.classList.add('anim-shake');
        setTimeout(() => {
          confirmEl.dataset.confirming = '';
          confirmEl.textContent = '🗑️ Reset Game';
        }, 3000);
      }
    });

    this.el.appendChild(panel);
  }

  get element(): HTMLElement {
    return this.el;
  }
}
