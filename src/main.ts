import './styles/reset.css';
import './styles/theme.css';
import './styles/layout.css';
import './styles/animations.css';

import { gameState } from './core/GameState.js';
import { eventBus } from './core/EventBus.js';
import { saveSystem } from './core/SaveSystem.js';
import { customerQueue } from './market/CustomerQueue.js';
import { ScreenManager, type ScreenName } from './ui/ScreenManager.js';
import { CoinDisplay } from './ui/components/CoinDisplay.js';
import { MarketStall } from './ui/components/MarketStall.js';
import { UpgradePanel } from './ui/components/UpgradePanel.js';
import { WelcomeScreen } from './ui/components/WelcomeScreen.js';
import { getReputationLevel } from './progression/Reputation.js';
import { checkMilestones } from './progression/Milestones.js';

function boot(): void {
  const app = document.getElementById('app')!;

  // Show welcome screen; game starts after user clicks
  new WelcomeScreen(document.body, () => {
    startGame(app);
  });
}

function startGame(app: HTMLElement): void {

  // Build header
  const header = document.createElement('header');
  header.className = 'game-header';

  const titleEl = document.createElement('div');
  titleEl.className = 'game-header__title';
  titleEl.textContent = '🏪 Gobbo Market';

  const stats = document.createElement('div');
  stats.className = 'game-header__stats';

  const coinDisplay = new CoinDisplay(stats);

  const repEl = document.createElement('div');
  repEl.style.cssText = 'font-family: var(--font-display); font-size: 0.95rem; color: var(--ink-dim);';
  repEl.id = 'rep-display';
  updateRepDisplay(repEl);
  stats.appendChild(repEl);

  const tierEl = document.createElement('div');
  tierEl.style.cssText = 'font-family: var(--font-display); font-size: 0.95rem; color: var(--gold-dim);';
  tierEl.id = 'tier-display';
  updateTierDisplay(tierEl);
  stats.appendChild(tierEl);

  header.appendChild(titleEl);
  header.appendChild(stats);
  app.appendChild(header);

  // Build navigation
  const nav = document.createElement('nav');
  nav.className = 'game-nav';

  const screens: { name: ScreenName; label: string }[] = [
    { name: 'market', label: '🏪 Market' },
    { name: 'upgrades', label: '⬆️ Upgrades' },
    { name: 'progress', label: '📈 Progress' },
    { name: 'help', label: '❓ Help' },
  ];

  for (const s of screens) {
    const btn = document.createElement('button');
    btn.className = 'game-nav__btn';
    btn.textContent = s.label;
    btn.dataset.screen = s.name;
    btn.addEventListener('click', () => screenManager.show(s.name));
    nav.appendChild(btn);
  }
  app.appendChild(nav);

  // Build content area
  const content = document.createElement('main');
  content.className = 'game-content';
  app.appendChild(content);

  // Screen manager
  const screenManager = new ScreenManager(content);

  // Market screen
  const marketScreen = document.createElement('div');
  new MarketStall(marketScreen);
  screenManager.register('market', marketScreen);

  // Upgrades screen
  const upgradeScreen = document.createElement('div');
  upgradeScreen.style.cssText = 'padding: 0 12px; max-width: 900px; margin: 0 auto; overflow-y: auto; height: 100%;';
  new UpgradePanel(upgradeScreen, 'upgrades');
  screenManager.register('upgrades', upgradeScreen);

  // Progress screen
  const progressScreen = document.createElement('div');
  progressScreen.style.cssText = 'padding: 0 12px; max-width: 1100px; margin: 0 auto; overflow-y: auto; height: 100%;';
  new UpgradePanel(progressScreen, 'progress');
  screenManager.register('progress', progressScreen);

  // Help screen
  const helpScreen = document.createElement('div');
  helpScreen.style.cssText = 'padding: 16px 12px; max-width: 900px; margin: 0 auto; overflow-y: auto; height: 100%;';
  helpScreen.innerHTML = buildHelpContent();
  screenManager.register('help', helpScreen);

  // Show initial screen
  screenManager.show('market');

  // Update active nav button
  eventBus.on('screen:changed', ({ screen }) => {
    nav.querySelectorAll('.game-nav__btn').forEach(btn => {
      (btn as HTMLElement).classList.toggle('active', (btn as HTMLElement).dataset.screen === screen);
    });
  });

  // Start customer queue
  customerQueue.start();

  // Auto-save whenever coins change
  eventBus.on('coins:changed', () => saveSystem.save());

  // Update header displays on changes
  eventBus.on('reputation:changed', () => updateRepDisplay(repEl));
  eventBus.on('tier:unlocked', ({ name }) => {
    updateTierDisplay(tierEl);
    showTierNotification(name);
  });

  // Check milestones periodically
  eventBus.on('coins:changed', () => checkMilestones());

  // Prevent accidental close
  window.addEventListener('beforeunload', (e) => {
    saveSystem.save();
    if (gameState.data.totalEarned > 100) {
      e.preventDefault();
    }
  });

  // Suppress unused variable warnings
  void coinDisplay;
}

function updateRepDisplay(el: HTMLElement): void {
  el.textContent = `⭐ ${getReputationLevel()} (${gameState.reputation})`;
}

function updateTierDisplay(el: HTMLElement): void {
  el.textContent = `📍 ${gameState.tierName}`;
}

function showTierNotification(tierName: string): void {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 80px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--bg-dark);
    border: 2px solid var(--gold);
    border-radius: 12px;
    padding: 16px 32px;
    z-index: 300;
    text-align: center;
    box-shadow: 0 0 30px rgba(212, 168, 67, 0.3), 0 8px 24px rgba(0,0,0,0.6);
  `;
  notification.innerHTML = `
    <p style="font-family: var(--font-display); color: var(--gold); font-size: 1.3rem; margin-bottom: 4px;">
      🗺️ New Market Tier!
    </p>
    <p style="color: var(--gold-bright); font-size: 1.1rem;">${tierName}</p>
  `;
  notification.animate([
    { opacity: 0, transform: 'translateX(-50%) translateY(20px)' },
    { opacity: 1, transform: 'translateX(-50%) translateY(0)' },
  ], { duration: 400, easing: 'ease', fill: 'forwards' });
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.5s ease';
    setTimeout(() => notification.remove(), 500);
  }, 3000);
}

function buildHelpContent(): string {
  return `
    <div style="display: flex; flex-direction: column; gap: 20px; color: var(--ink); font-size: 0.92rem; line-height: 1.6;">
      <div class="panel">
        <div class="panel-header"><h3>📖 How to Play</h3></div>
        <p style="color: var(--ink-dim); margin-bottom: 8px;">
          Welcome to <strong style="color: var(--gold);">Gobbo Market</strong> — a fantasy merchant game where you buy, craft, enchant, and sell goods to build your fortune. The goal is to reach <strong style="color: var(--gold);">1,000,000 gold coins</strong>!
        </p>
        <p style="color: var(--ink-dim);">
          This is not an idle game — you'll need to play minigames and make strategic decisions to progress. Your game saves automatically whenever you earn or spend coins.
        </p>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">

        <div class="panel">
          <div class="panel-header"><h3>🛒 Buying Goods</h3></div>
          <p style="color: var(--ink-dim);">
            On the Market tab, browse available goods and click one to buy it. Buying triggers the <strong style="color: var(--gold);">Appraisal minigame</strong> — a memory-match card game. Flip pairs of matching cards before time runs out. The more pairs you match, the higher the quality of the item you receive.
          </p>
        </div>

        <div class="panel">
          <div class="panel-header"><h3>⚒️ Crafting Items</h3></div>
          <p style="color: var(--ink-dim);">
            Once you unlock recipes (on the Upgrades tab), you can craft items. Crafting triggers the <strong style="color: var(--gold);">Forge minigame</strong> — time your clicks when the moving bar is in the golden sweet spot. Better timing means higher quality. Each strike gets faster!
          </p>
        </div>

        <div class="panel">
          <div class="panel-header"><h3>✨ Enchanting</h3></div>
          <p style="color: var(--ink-dim);">
            Click an inventory item marked with ✨ to enchant it. This starts the <strong style="color: var(--gold);">Sliding Puzzle minigame</strong> — rearrange a 3×3 grid of rune tiles to match the target pattern before time runs out. Enchanted items sell for significantly more. You can finish early for partial credit.
          </p>
        </div>

        <div class="panel">
          <div class="panel-header"><h3>🎲 Selling & Haggling</h3></div>
          <p style="color: var(--ink-dim);">
            Customers appear in the queue with desires for specific item categories. Click a customer, choose an item to sell, then play the <strong style="color: var(--gold);">Haggle minigame</strong>. The customer rolls a d20 — you keep rolling d6s to try to beat their total. Settle any time for a medium deal, but roll a 1 and you get a bad deal!
          </p>
        </div>

        <div class="panel">
          <div class="panel-header"><h3>📈 Progression</h3></div>
          <p style="color: var(--ink-dim);">
            Selling items earns you <strong style="color: var(--gold);">coins</strong> and <strong style="color: var(--gold);">reputation</strong>. Both are needed to unlock higher market tiers, which give access to better goods, new customer types, upgrades, and recipes. Check the Upgrades tab to buy upgrades and recipes, and the Progress tab to see your tier requirements and milestones.
          </p>
        </div>

        <div class="panel">
          <div class="panel-header"><h3>🏆 Milestones</h3></div>
          <p style="color: var(--ink-dim);">
            As you play, you'll unlock milestones for crafting, selling, earning gold, and reaching new market tiers. Track your progress on the Progress tab. Reach the final milestone — <strong style="color: var(--gold);">Goblin Tycoon</strong> — to win the game!
          </p>
        </div>

      </div>

      <div class="panel">
        <div class="panel-header"><h3>💡 Tips</h3></div>
        <ul style="color: var(--ink-dim); padding-left: 20px; display: flex; flex-direction: column; gap: 6px;">
          <li>Buy early-game upgrades as soon as you can — they compound quickly.</li>
          <li>Higher quality items sell for more, so practice the forge timing.</li>
          <li>Enchanting an item before selling it can dramatically boost its price.</li>
          <li>Don't be greedy in the haggle — settling for a medium deal beats busting!</li>
          <li>Customers leave if you take too long, so serve them before they walk away.</li>
          <li>Craft items when you can — crafted goods are free to make (you just need the recipe and materials cost).</li>
          <li>Keep an eye on which categories customers want and stock up accordingly.</li>
        </ul>
      </div>
    </div>
  `;
}

// Boot the game
boot();
