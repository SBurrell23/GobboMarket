import './styles/reset.css';
import './styles/theme.css';
import './styles/layout.css';
import './styles/animations.css';

import { initSounds, soundManager } from './audio/initSounds.js';
import { showSettingsModal } from './ui/components/SettingsModal.js';
import { gameState } from './core/GameState.js';
import { TIER_NAMES, TIER_BACKGROUND_IMAGES, TIER_RACE_REPUTATION_REQUIRED, CUSTOMER_TIER_UNLOCK, CUSTOMER_ICONS } from './core/constants.js';
import { eventBus } from './core/EventBus.js';
import { saveSystem } from './core/SaveSystem.js';
import { customerQueue } from './market/CustomerQueue.js';
import { ScreenManager, type ScreenName } from './ui/ScreenManager.js';
import { CoinDisplay } from './ui/components/CoinDisplay.js';
import { HeaderProgress } from './ui/components/HeaderProgress.js';
import { MarketStall } from './ui/components/MarketStall.js';
import { UpgradePanel } from './ui/components/UpgradePanel.js';
import { WelcomeScreen } from './ui/components/WelcomeScreen.js';

function showRepToast(amount: number, race: string): void {
  const icon = CUSTOMER_ICONS[race] ?? '❓';
  const toast = document.createElement('div');
  toast.className = 'rep-toast';
  toast.textContent = `+${amount.toLocaleString()} ${icon}`;
  (document.getElementById('toast-container') ?? document.body).appendChild(toast);
  setTimeout(() => toast.remove(), 2450);
}

const IMAGES_BASE = `${import.meta.env.BASE_URL}assets/images/`;

function updateBackgroundImage(): void {
  const tier = gameState.currentTier;
  const filename = TIER_BACKGROUND_IMAGES[tier] ?? TIER_BACKGROUND_IMAGES[0];
  const url = `${IMAGES_BASE}${filename}`;
  document.body.style.backgroundImage = `linear-gradient(rgba(17, 12, 4, 0.45), rgba(17, 12, 4, 0.45)), url('${url}')`;
}

function boot(): void {
  initSounds();

  const app = document.getElementById('app')!;

  // Show welcome screen; game starts after user clicks
  new WelcomeScreen(document.body, () => {
    soundManager.play('game_start');
    soundManager.startBackgroundMusic(); // Start music on first user interaction (browsers block autoplay before that)
    // Build game and set correct tier background BEFORE fading welcome screen to avoid flash
    startGame(app);
  });
}

function startGame(app: HTMLElement): void {
  updateBackgroundImage();

  // Toast container: centers gold + rep toasts together at bottom
  const toastContainer = document.createElement('div');
  toastContainer.id = 'toast-container';
  toastContainer.style.cssText = 'position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); display: flex; flex-direction: row; gap: 12px; align-items: center; pointer-events: none; z-index: 250;';
  document.body.appendChild(toastContainer);

  // Build header
  const header = document.createElement('header');
  header.className = 'game-header';

  const titleEl = document.createElement('div');
  titleEl.className = 'game-header__title';
  titleEl.textContent = '🏪 Gobbo Market';

  const stats = document.createElement('div');
  stats.className = 'game-header__stats';

  const coinDisplay = new CoinDisplay(stats);

  const tierEl = document.createElement('div');
  tierEl.style.cssText = 'font-family: var(--font-display); font-size: 0.95rem; color: var(--gold-dim);';
  tierEl.id = 'tier-display';
  updateTierDisplay(tierEl);
  stats.appendChild(tierEl);

  const settingsBtn = document.createElement('button');
  settingsBtn.className = 'btn btn-subtle';
  settingsBtn.textContent = '⚙️';
  settingsBtn.style.cssText = 'padding: 4px 10px; font-size: 1rem;';
  settingsBtn.title = 'Settings';
  settingsBtn.addEventListener('click', () => showSettingsModal());
  stats.appendChild(settingsBtn);

  const progressEl = document.createElement('div');
  new HeaderProgress(progressEl);

  header.appendChild(titleEl);
  header.appendChild(progressEl);
  header.appendChild(stats);
  app.appendChild(header);

  // Build navigation
  const nav = document.createElement('nav');
  nav.className = 'game-nav';

  const screens: { name: ScreenName; label: string }[] = [
    { name: 'market', label: '🏪 Market' },
    { name: 'upgrades', label: '⬆️ Upgrades & Recipes' },
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
  helpScreen.className = 'help-screen';
  helpScreen.style.cssText = 'padding: 12px 8px; width: 100%; min-width: 0; overflow-y: auto; height: 100%; box-sizing: border-box;';
  helpScreen.innerHTML = buildHelpContent();
  screenManager.register('help', helpScreen);

  // Update active nav button when screen changes (register before show so initial state is set)
  eventBus.on('screen:changed', ({ screen }) => {
    nav.querySelectorAll('.game-nav__btn').forEach(btn => {
      (btn as HTMLElement).classList.toggle('active', (btn as HTMLElement).dataset.screen === screen);
    });
  });

  // Show initial screen
  screenManager.show('market');

  // Start customer queue
  customerQueue.start();

  // Auto-save whenever coins change
  eventBus.on('coins:changed', () => saveSystem.save());

  // Update header displays and background on tier change
  eventBus.on('tier:unlocked', ({ name }) => {
    updateTierDisplay(tierEl);
    updateBackgroundImage();
    showTierNotification(name);
  });

  eventBus.on('reputation:changed', ({ amount, race }) => {
    if (amount > 0) showRepToast(amount, race);
  });

  // Milestones are checked after sales (showNewMilestones) and after craft/buy; not on coins:changed
  // so the 1M milestone popup and victory modal show correctly when crossing the threshold.

  // Prevent accidental close
  window.addEventListener('beforeunload', (e) => {
    saveSystem.save();
    if (gameState.data.totalEarned > 100) {
      e.preventDefault();
    }
  });

  // Dev overlay: tilde to toggle, add gold for testing
  const devOverlay = document.createElement('div');
  devOverlay.id = 'dev-overlay';
  devOverlay.style.cssText = `
    display: none;
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 1000;
    background: var(--bg-dark);
    border: 2px solid var(--gold-dim);
    border-radius: 8px;
    padding: 16px 24px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.6);
    font-family: var(--font-body);
  `;
  devOverlay.innerHTML = `
    <div style="color: var(--gold); font-weight: 600; margin-bottom: 12px; font-size: 0.9rem;">Dev Tools</div>
    <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 12px;">
      <input type="number" id="dev-gold-input" placeholder="Gold amount" min="1" step="1"
        style="width: 120px; padding: 8px 12px; background: var(--parchment); border: 1px solid var(--parchment-lighter); border-radius: 4px; color: var(--ink); font-size: 0.95rem;">
      <button type="button" id="dev-gold-add" class="btn btn-gold" style="padding: 8px 16px;">Add Gold</button>
    </div>
    <button type="button" id="dev-rep-add" class="btn btn-subtle" style="padding: 8px 16px; width: 100%;">Add Next Tier Rep</button>
    <div style="margin-top: 8px; font-size: 0.8rem; color: var(--ink-dim);">Press ~ to close</div>
  `;
  document.body.appendChild(devOverlay);

  const devInput = devOverlay.querySelector('#dev-gold-input') as HTMLInputElement;
  const devAddBtn = devOverlay.querySelector('#dev-gold-add')!;
  const devRepBtn = devOverlay.querySelector('#dev-rep-add')!;

  devAddBtn.addEventListener('click', () => {
    const amount = parseInt(devInput.value, 10);
    if (!amount || amount <= 0) return;
    gameState.addCoins(amount, 'dev');
    devInput.value = '';
  });

  devInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') devAddBtn.dispatchEvent(new Event('click'));
  });

  devRepBtn.addEventListener('click', () => {
    const nextTier = gameState.currentTier + 1;
    if (nextTier >= TIER_NAMES.length) return;
    const raceReqs = TIER_RACE_REPUTATION_REQUIRED[nextTier];
    if (!raceReqs) return;
    for (const [race, required] of Object.entries(raceReqs)) {
      const current = gameState.getRaceReputation(race);
      const needed = Math.max(0, required - current);
      if (needed > 0) gameState.addRaceReputation(race, needed);
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === '`' || e.key === '~') {
      e.preventDefault();
      const visible = devOverlay.style.display === 'block';
      devOverlay.style.display = visible ? 'none' : 'block';
      if (!visible) devInput.focus();
    }
    if (e.key === 'Escape' && devOverlay.style.display === 'block') {
      devOverlay.style.display = 'none';
    }
  });

  // Suppress unused variable warnings
  void coinDisplay;
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

const CATEGORY_PLURAL: Record<string, string> = {
  weapon: 'WEAPONS', armor: 'ARMOR', potion: 'POTIONS', trinket: 'TRINKETS', food: 'FOOD', material: 'MATERIALS',
};

const RACES_HELP: { icon: string; name: string; prefs: string[]; haggle: string; budget: string }[] = [
  { icon: '👺', name: 'Goblin', prefs: ['weapon', 'food', 'trinket', 'potion'], haggle: 'Tough', budget: '0.8x' },
  { icon: '🧑', name: 'Human', prefs: ['weapon', 'armor', 'food', 'potion'], haggle: 'Poor', budget: '1x' },
  { icon: '🧝', name: 'Elf', prefs: ['potion', 'trinket', 'weapon'], haggle: 'Tough', budget: '1.2x' },
  { icon: '⛏️', name: 'Dwarf', prefs: ['armor', 'weapon', 'food'], haggle: 'Medium', budget: '1x' },
  { icon: '👹', name: 'Orc', prefs: ['weapon', 'food', 'armor'], haggle: 'Poor', budget: '1x' },
  { icon: '🧒', name: 'Halfling', prefs: ['food', 'potion', 'trinket'], haggle: 'Medium', budget: '1x' },
  { icon: '👑', name: 'Noble', prefs: ['trinket', 'armor', 'potion'], haggle: 'Medium', budget: '1.5x' },
  { icon: '🧙', name: 'Wizard', prefs: ['potion', 'weapon', 'food'], haggle: 'Tough', budget: '1.3x' },
];

function buildHelpContent(): string {
  const racesRows = RACES_HELP.map((r, i) => {
    const type = ['goblin', 'human', 'elf', 'dwarf', 'orc', 'halfling', 'noble', 'wizard'][i] as keyof typeof CUSTOMER_TIER_UNLOCK;
    const icon = CUSTOMER_ICONS[type] ?? r.icon;
    const tierIdx = CUSTOMER_TIER_UNLOCK[type] ?? 0;
    const tierName = TIER_NAMES[tierIdx] ?? 'Unknown';
    const prefsStr = r.prefs.map(c => CATEGORY_PLURAL[c] ?? c.toUpperCase()).join(', ');
    const cell = 'style="border: 1px solid var(--parchment-lighter); padding: 6px 8px;"';
    return `<tr><td ${cell}>${icon} ${r.name}</td><td ${cell}>${prefsStr}</td><td ${cell}>${tierName}</td><td ${cell}>${r.haggle}</td><td ${cell}>${r.budget}</td></tr>`;
  }).join('');

  return `
    <div class="help-content help-mosaic" style="color: var(--ink); font-size: 0.92rem; line-height: 1.6;">
      <div class="panel help-card-span-8">
        <div class="panel-header"><h3>📖 How to Play</h3></div>
        <p style="color: var(--ink-dim); margin-bottom: 8px;">
          Welcome to <strong style="color: var(--gold);">Gobbo Market</strong> — a fantasy merchant game where you buy, craft, enchant, and sell goods to build your fortune. The goal is to reach <strong style="color: var(--gold);">1,000,000 gold coins</strong>!
        </p>
        <p style="color: var(--ink-dim);">
          This is not an idle game — you'll need to play minigames and make strategic decisions to progress. Your game saves automatically whenever you earn or spend coins.
        </p>
      </div>

        <div class="panel help-card-span-4">
          <div class="panel-header"><h3>👥 Races</h3></div>
          <p style="color: var(--ink-dim); margin-bottom: 12px; font-size: 0.88rem;">
            Each race prefers certain item categories and has unique traits. <strong style="color: var(--gold);">WANTED</strong> item types pay +35%.
          </p>
          <table style="border-collapse: collapse; width: 100%; font-size: 0.82rem;">
            <thead>
              <tr>
                <th style="border: 1px solid var(--parchment-lighter); padding: 6px 8px; text-align: left; color: var(--gold);">Race</th>
                <th style="border: 1px solid var(--parchment-lighter); padding: 6px 8px; text-align: left; color: var(--gold);">Preferences</th>
                <th style="border: 1px solid var(--parchment-lighter); padding: 6px 8px; text-align: left; color: var(--gold);">Market Tier</th>
                <th style="border: 1px solid var(--parchment-lighter); padding: 6px 8px; text-align: left; color: var(--gold);">Haggle</th>
                <th style="border: 1px solid var(--parchment-lighter); padding: 6px 8px; text-align: left; color: var(--gold);">Budget</th>
              </tr>
            </thead>
            <tbody style="color: var(--ink-dim);">
              ${racesRows}
            </tbody>
          </table>
        </div>

        <div class="panel help-card-span-4">
          <div class="panel-header"><h3>⭐ Item Quality</h3></div>
          <p style="color: var(--ink-dim); margin-bottom: 12px; font-size: 0.88rem;">
            Quality affects sell price and reputation. Earned from reaction time (buy) and forge timing (craft).
          </p>
          <table style="border-collapse: collapse; width: 100%; font-size: 0.88rem;">
            <thead>
              <tr>
                <th style="border: 1px solid var(--parchment-lighter); padding: 6px 8px; text-align: left; color: var(--gold);">Quality</th>
                <th style="border: 1px solid var(--parchment-lighter); padding: 6px 8px; text-align: left; color: var(--gold);">Sell</th>
                <th style="border: 1px solid var(--parchment-lighter); padding: 6px 8px; text-align: left; color: var(--gold);">Rep Bonus</th>
                <th style="border: 1px solid var(--parchment-lighter); padding: 6px 8px; text-align: left; color: var(--gold);">Description</th>
              </tr>
            </thead>
            <tbody style="color: var(--ink-dim);">
              <tr><td style="border: 1px solid var(--parchment-lighter); padding: 6px 8px;"><strong style="color: var(--quality-shoddy);">Shoddy</strong></td><td style="border: 1px solid var(--parchment-lighter); padding: 6px 8px;">0.6x</td><td style="border: 1px solid var(--parchment-lighter); padding: 6px 8px;">0</td><td style="border: 1px solid var(--parchment-lighter); padding: 6px 8px;">Poor minigame performance</td></tr>
              <tr><td style="border: 1px solid var(--parchment-lighter); padding: 6px 8px;"><strong style="color: var(--quality-passable);">Passable</strong></td><td style="border: 1px solid var(--parchment-lighter); padding: 6px 8px;">1.0x</td><td style="border: 1px solid var(--parchment-lighter); padding: 6px 8px;">0</td><td style="border: 1px solid var(--parchment-lighter); padding: 6px 8px;">Mediocre performance</td></tr>
              <tr><td style="border: 1px solid var(--parchment-lighter); padding: 6px 8px;"><strong style="color: var(--quality-fine);">Fine</strong></td><td style="border: 1px solid var(--parchment-lighter); padding: 6px 8px;">1.2x</td><td style="border: 1px solid var(--parchment-lighter); padding: 6px 8px;">+3</td><td style="border: 1px solid var(--parchment-lighter); padding: 6px 8px;">Decent performance</td></tr>
              <tr><td style="border: 1px solid var(--parchment-lighter); padding: 6px 8px;"><strong style="color: var(--quality-superior);">Superior</strong></td><td style="border: 1px solid var(--parchment-lighter); padding: 6px 8px;">1.5x</td><td style="border: 1px solid var(--parchment-lighter); padding: 6px 8px;">+5</td><td style="border: 1px solid var(--parchment-lighter); padding: 6px 8px;">Great performance</td></tr>
              <tr><td style="border: 1px solid var(--parchment-lighter); padding: 6px 8px;"><strong style="color: var(--quality-masterwork);">Masterwork</strong></td><td style="border: 1px solid var(--parchment-lighter); padding: 6px 8px;">1.8x</td><td style="border: 1px solid var(--parchment-lighter); padding: 6px 8px;">+10</td><td style="border: 1px solid var(--parchment-lighter); padding: 6px 8px;">Amazing performance</td></tr>
            </tbody>
          </table>
        </div>

        <div class="panel help-card-span-4">
          <div class="panel-header"><h3>🎲 Customers & Haggling</h3></div>
          <p style="color: var(--ink-dim); margin-bottom: 8px; font-size: 0.88rem;">
            Customers appear in the queue with desires for specific item categories. Click a customer, choose an item to sell, then play the <strong style="color: var(--gold);">Haggle minigame</strong>. The customer rolls a d20 — you keep rolling d6s to try to beat their total. Settle any time for a medium deal, but roll a 1 and you get a bad deal!
          </p>
          <p style="color: var(--ink-dim); margin-bottom: 8px; font-size: 0.88rem;">
            <strong style="color: var(--gold);">Haggle skill</strong> affects the customer's d20 roll — higher skill means higher minimum. Each customer gets a random skill tier.
          </p>
          <table style="border-collapse: collapse; width: 100%; font-size: 0.82rem; margin-bottom: 8px;">
            <thead>
              <tr>
                <th style="border: 1px solid var(--parchment-lighter); padding: 6px 8px; text-align: left; color: var(--gold);">Outcome</th>
                <th style="border: 1px solid var(--parchment-lighter); padding: 6px 8px; text-align: left; color: var(--gold);">Price</th>
                <th style="border: 1px solid var(--parchment-lighter); padding: 6px 8px; text-align: left; color: var(--gold);">Reputation</th>
              </tr>
            </thead>
            <tbody style="color: var(--ink-dim);">
              <tr><td style="border: 1px solid var(--parchment-lighter); padding: 6px 8px;">Win</td><td style="border: 1px solid var(--parchment-lighter); padding: 6px 8px;">1.5x</td><td style="border: 1px solid var(--parchment-lighter); padding: 6px 8px;">+5</td></tr>
              <tr><td style="border: 1px solid var(--parchment-lighter); padding: 6px 8px;">Settle</td><td style="border: 1px solid var(--parchment-lighter); padding: 6px 8px;">1.0x–1.25x</td><td style="border: 1px solid var(--parchment-lighter); padding: 6px 8px;">+1</td></tr>
              <tr><td style="border: 1px solid var(--parchment-lighter); padding: 6px 8px;">Bust (roll 1)</td><td style="border: 1px solid var(--parchment-lighter); padding: 6px 8px;">0.65x–0.85x</td><td style="border: 1px solid var(--parchment-lighter); padding: 6px 8px;">-1</td></tr>
            </tbody>
          </table>
          <ul style="color: var(--ink-dim); font-size: 0.88rem; margin: 0; padding-left: 20px;">
            <li>Items that customers  <strong style="color: var(--gold);">WANT</strong> (Desired) sell for +35%</li>
          </ul>
        </div>

        <div class="panel help-card-span-4">
          <div class="panel-header"><h3>✨ Enchanting</h3></div>
          <p style="color: var(--ink-dim); margin-bottom: 12px;">
            Click an inventory item marked with ✨ to enchant it. This starts the <strong style="color: var(--gold);">Sliding Puzzle minigame</strong> — rearrange a 3×3 grid of rune tiles to match the target pattern. Enchanted items sell for significantly more. You can finish early for partial credit.
          </p>
          <table style="border-collapse: collapse; width: 100%; font-size: 0.74rem; line-height: 1.2;">
            <thead>
              <tr>
                <th style="border: 1px solid var(--parchment-lighter); padding: 2px 6px; text-align: left; color: var(--gold);">Tiles</th>
                <th style="border: 1px solid var(--parchment-lighter); padding: 2px 6px; text-align: left; color: var(--gold);">Multiplier</th>
              </tr>
            </thead>
            <tbody style="color: var(--ink-dim);">
              <tr><td style="border: 1px solid var(--parchment-lighter); padding: 2px 6px;">0/9</td><td style="border: 1px solid var(--parchment-lighter); padding: 2px 6px;">1.0x</td></tr>
              <tr><td style="border: 1px solid var(--parchment-lighter); padding: 2px 6px;">1/9</td><td style="border: 1px solid var(--parchment-lighter); padding: 2px 6px;">~1.2x</td></tr>
              <tr><td style="border: 1px solid var(--parchment-lighter); padding: 2px 6px;">2/9</td><td style="border: 1px solid var(--parchment-lighter); padding: 2px 6px;">~1.4x</td></tr>
              <tr><td style="border: 1px solid var(--parchment-lighter); padding: 2px 6px;">3/9</td><td style="border: 1px solid var(--parchment-lighter); padding: 2px 6px;">~1.7x</td></tr>
              <tr><td style="border: 1px solid var(--parchment-lighter); padding: 2px 6px;">4/9</td><td style="border: 1px solid var(--parchment-lighter); padding: 2px 6px;">~1.9x</td></tr>
              <tr><td style="border: 1px solid var(--parchment-lighter); padding: 2px 6px;">5/9</td><td style="border: 1px solid var(--parchment-lighter); padding: 2px 6px;">~2.1x</td></tr>
              <tr><td style="border: 1px solid var(--parchment-lighter); padding: 2px 6px;">6/9</td><td style="border: 1px solid var(--parchment-lighter); padding: 2px 6px;">~2.3x</td></tr>
              <tr><td style="border: 1px solid var(--parchment-lighter); padding: 2px 6px;">7/9</td><td style="border: 1px solid var(--parchment-lighter); padding: 2px 6px;">~2.6x</td></tr>
              <tr><td style="border: 1px solid var(--parchment-lighter); padding: 2px 6px;">8/9</td><td style="border: 1px solid var(--parchment-lighter); padding: 2px 6px;">~2.8x</td></tr>
              <tr><td style="border: 1px solid var(--parchment-lighter); padding: 2px 6px;">9/9</td><td style="border: 1px solid var(--parchment-lighter); padding: 2px 6px;">3.0x+</td></tr>
            </tbody>
          </table>
        </div>

        <div class="panel help-card-span-2">
          <div class="panel-header"><h3>📜 Reputation</h3></div>
          <p style="color: var(--ink-dim); margin-bottom: 8px; font-size: 0.88rem;">Ways to earn reputation:</p>
          <ul style="color: var(--ink-dim); font-size: 0.88rem; margin: 0; display: flex; flex-direction: column; gap: 4px;">
            <li>Base 5 reputation per sale</li>
            <li>+3 if the customer wants that item type</li>
            <li>Fine +3, Superior +5, Masterwork +10</li>
            <li>+5 for winning the haggle, +1 for settling, -1 for busting</li>
          </ul>
        </div>

        <div class="panel help-card-span-2">
          <div class="panel-header"><h3>📦 Buy Goods</h3></div>
          <p style="color: var(--ink-dim);">
            On the Market tab, browse available goods and click one to buy it. Buying triggers the <strong style="color: var(--gold);">Buy Goods minigame</strong> — wait for "Buy!" to appear (1-6 seconds), then click or press Space as fast as you can. The faster your reaction, the higher the item quality.
          </p>
        </div>

        <div class="panel help-card-span-2">
          <div class="panel-header"><h3>⚒️ Crafting Items</h3></div>
          <p style="color: var(--ink-dim);">
            You start with a few crafting recipes. Crafting triggers the <strong style="color: var(--gold);">Forge minigame</strong> — time your clicks when the moving bar is in the golden sweet spot. Better timing means higher quality. Each strike gets faster! Higher tier items are harder to craft — the forge has a smaller sweet spot and a faster-moving bar. You can buy more recipes from the Recipes list on the Upgrades tab.
          </p>
        </div>

        <div class="panel help-card-span-2">
          <div class="panel-header"><h3>📈 Progression</h3></div>
          <ul style="color: var(--ink-dim); margin: 0; display: flex; flex-direction: column; gap: 6px;">
            <li>Higher tier items will sell for significantly more coins</li>
            <li>Buy upgrades and recipes to increase your profits</li>
            <li>Both coins AND reputation are needed to unlock higher markets</li>
            <li>Reputation is not tied to item tier</li>
          </ul>
        </div>

      <div class="panel help-card-span-8">
        <div class="panel-header"><h3>💡 Tips</h3></div>
        <ul style="color: var(--ink-dim); display: flex; flex-direction: column; gap: 6px;">
          <li>Your highest tier items will be the most profitable. Craft them well and enchant them!</li>
          <li>All items tiers reward the same base reputation, so use lower tier items to build reputation while your high tier items are on cooldown!</li>
          <li>Choose your customers wisely to make the most profit off your highest value items!</li>
          <li>Don't be greedy in the haggle — settling early for a medium deal beats busting!</li>
          <li>Customers leave if you take too long, so serve them before they walk away.</li>
          <li>Enchanting only effects the sell price, it might not be worth the time if you are selling soley for reputation.</li>
        </ul>
      </div>
    </div>
  `;
}

// Boot the game
boot();
