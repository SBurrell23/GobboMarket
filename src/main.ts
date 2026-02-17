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

  const saveBtn = document.createElement('button');
  saveBtn.className = 'btn btn-subtle';
  saveBtn.textContent = '💾 Save';
  saveBtn.addEventListener('click', () => {
    saveSystem.save();
    saveBtn.textContent = '✓ Saved!';
    setTimeout(() => { saveBtn.textContent = '💾 Save'; }, 1500);
  });
  stats.appendChild(saveBtn);

  header.appendChild(titleEl);
  header.appendChild(stats);
  app.appendChild(header);

  // Build navigation
  const nav = document.createElement('nav');
  nav.className = 'game-nav';

  const screens: { name: ScreenName; label: string }[] = [
    { name: 'market', label: '🏪 Market' },
    { name: 'upgrades', label: '⬆️ Upgrades & Progress' },
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
  upgradeScreen.style.cssText = 'padding: 0; max-width: 800px; margin: 0 auto; overflow-y: auto; height: 100%;';
  new UpgradePanel(upgradeScreen);
  screenManager.register('upgrades', upgradeScreen);

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

  // Setup auto-save
  const cancelAutoSave = saveSystem.autoSaveInterval(30_000);

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
  void cancelAutoSave;
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
  notification.classList.add('anim-slide-up');
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.5s ease';
    setTimeout(() => notification.remove(), 500);
  }, 3000);
}

// Boot the game
boot();
