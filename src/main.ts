import './styles/reset.css';
import './styles/theme.css';
import './styles/layout.css';
import './styles/animations.css';

import { initSounds, soundManager } from './audio/initSounds.js';
import { showSettingsModal } from './ui/components/SettingsModal.js';
import { gameState } from './core/GameState.js';
import { TIER_NAMES, CUSTOMER_TIER_UNLOCK } from './core/constants.js';
import { eventBus } from './core/EventBus.js';
import { saveSystem } from './core/SaveSystem.js';
import { customerQueue } from './market/CustomerQueue.js';
import { ScreenManager, type ScreenName } from './ui/ScreenManager.js';
import { CoinDisplay } from './ui/components/CoinDisplay.js';
import { HeaderProgress } from './ui/components/HeaderProgress.js';
import { MarketStall } from './ui/components/MarketStall.js';
import { UpgradePanel } from './ui/components/UpgradePanel.js';
import { WelcomeScreen } from './ui/components/WelcomeScreen.js';
import { checkMilestones } from './progression/Milestones.js';

function boot(): void {
  initSounds();

  const app = document.getElementById('app')!;

  // Show welcome screen; game starts after user clicks
  new WelcomeScreen(document.body, () => {
    soundManager.play('game_start');
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
  helpScreen.style.cssText = 'padding: 16px 2.5%; max-width: 95%; width: 95%; margin: 0 auto; overflow-y: auto; height: 100%;';
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
  { icon: '👺', name: 'Goblin', prefs: ['weapon', 'food', 'trinket', 'potion'], haggle: 'High', budget: '0.8x' },
  { icon: '🧑', name: 'Human', prefs: ['weapon', 'armor', 'food', 'potion'], haggle: 'Medium', budget: '1x' },
  { icon: '🧝', name: 'Elf', prefs: ['potion', 'trinket', 'weapon'], haggle: 'Very high', budget: '1x' },
  { icon: '⛏️', name: 'Dwarf', prefs: ['armor', 'weapon', 'food'], haggle: 'High', budget: '1x' },
  { icon: '👹', name: 'Orc', prefs: ['weapon', 'food', 'armor'], haggle: 'Low', budget: '1x' },
  { icon: '🧒', name: 'Halfling', prefs: ['food', 'potion', 'trinket'], haggle: 'Medium', budget: '1x' },
  { icon: '👑', name: 'Noble', prefs: ['trinket', 'armor', 'potion'], haggle: 'Medium', budget: '1.5x' },
  { icon: '🧙', name: 'Wizard', prefs: ['potion', 'trinket', 'material'], haggle: 'Very high', budget: '1.3x' },
];

function buildHelpContent(): string {
  const racesRows = RACES_HELP.map((r, i) => {
    const type = ['goblin', 'human', 'elf', 'dwarf', 'orc', 'halfling', 'noble', 'wizard'][i] as keyof typeof CUSTOMER_TIER_UNLOCK;
    const tierIdx = CUSTOMER_TIER_UNLOCK[type] ?? 0;
    const tierName = TIER_NAMES[tierIdx] ?? 'Unknown';
    const prefsStr = r.prefs.map(c => CATEGORY_PLURAL[c] ?? c.toUpperCase()).join(', ');
    const cell = 'style="border: 1px solid var(--parchment-lighter); padding: 6px 8px;"';
    return `<tr><td ${cell}>${r.icon} ${r.name}</td><td ${cell}>${prefsStr}</td><td ${cell}>${tierName}</td><td ${cell}>${r.haggle}</td><td ${cell}>${r.budget}</td></tr>`;
  }).join('');

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
          <div class="panel-header"><h3>👥 Races</h3></div>
          <p style="color: var(--ink-dim); margin-bottom: 12px; font-size: 0.88rem;">
            Each race prefers certain item categories and has unique traits. Desired items pay +25%, refused items pay 50%.
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

        <div class="panel">
          <div class="panel-header"><h3>⭐ Item Quality</h3></div>
          <p style="color: var(--ink-dim); margin-bottom: 12px; font-size: 0.88rem;">
            Quality affects sell price and reputation. Earned from reaction time (buy) and forge timing (craft).
          </p>
          <table style="border-collapse: collapse; width: 100%; font-size: 0.88rem;">
            <thead>
              <tr>
                <th style="border: 1px solid var(--parchment-lighter); padding: 6px 8px; text-align: left; color: var(--gold);">Quality</th>
                <th style="border: 1px solid var(--parchment-lighter); padding: 6px 8px; text-align: left; color: var(--gold);">Sell</th>
                <th style="border: 1px solid var(--parchment-lighter); padding: 6px 8px; text-align: left; color: var(--gold);">Description</th>
              </tr>
            </thead>
            <tbody style="color: var(--ink-dim);">
              <tr><td style="border: 1px solid var(--parchment-lighter); padding: 6px 8px;"><strong style="color: var(--quality-shoddy);">Shoddy</strong></td><td style="border: 1px solid var(--parchment-lighter); padding: 6px 8px;">0.6x</td><td style="border: 1px solid var(--parchment-lighter); padding: 6px 8px;">Poor minigame performance</td></tr>
              <tr><td style="border: 1px solid var(--parchment-lighter); padding: 6px 8px;"><strong style="color: var(--quality-passable);">Passable</strong></td><td style="border: 1px solid var(--parchment-lighter); padding: 6px 8px;">0.85x</td><td style="border: 1px solid var(--parchment-lighter); padding: 6px 8px;">Mediocre performance</td></tr>
              <tr><td style="border: 1px solid var(--parchment-lighter); padding: 6px 8px;"><strong style="color: var(--quality-fine);">Fine</strong></td><td style="border: 1px solid var(--parchment-lighter); padding: 6px 8px;">1.0x</td><td style="border: 1px solid var(--parchment-lighter); padding: 6px 8px;">Decent performance</td></tr>
              <tr><td style="border: 1px solid var(--parchment-lighter); padding: 6px 8px;"><strong style="color: var(--quality-superior);">Superior</strong></td><td style="border: 1px solid var(--parchment-lighter); padding: 6px 8px;">1.3x</td><td style="border: 1px solid var(--parchment-lighter); padding: 6px 8px;">Great performance</td></tr>
              <tr><td style="border: 1px solid var(--parchment-lighter); padding: 6px 8px;"><strong style="color: var(--quality-masterwork);">Masterwork</strong></td><td style="border: 1px solid var(--parchment-lighter); padding: 6px 8px;">1.8x</td><td style="border: 1px solid var(--parchment-lighter); padding: 6px 8px;">Amazing performance</td></tr>
            </tbody>
          </table>
          <p style="color: var(--ink-dim); margin-top: 8px; font-size: 0.82rem;">
            Superior and Masterwork add bonus reputation per sale.
          </p>
        </div>

        <div class="panel">
          <div class="panel-header"><h3>🎲 Customers & Haggling</h3></div>
          <p style="color: var(--ink-dim); margin-bottom: 8px; font-size: 0.88rem;">
            <strong style="color: var(--gold);">Haggle skill</strong> affects the customer's d20 roll — higher skill means higher minimum. Each customer gets a random skill tier.
          </p>
          <p style="color: var(--ink-dim); margin-bottom: 8px; font-size: 0.88rem;">
            <strong style="color: var(--gold);">Outcomes:</strong> Win = 1.5x, +5 rep. Settle = 1.0x–1.25x. Bust (roll 1) = 0.65x–0.85x.
          </p>
          <p style="color: var(--ink-dim); font-size: 0.88rem;">
            Desired item +25% price. Refused item -50%. Noble pays 1.5x, Wizard 1.3x, Goblin 0.8x.
          </p>
        </div>

        <div class="panel">
          <div class="panel-header"><h3>📜 Reputation</h3></div>
          <p style="color: var(--ink-dim); margin-bottom: 8px; font-size: 0.88rem;">
            <strong style="color: var(--gold);">Earn:</strong> Base 8 per sale. +4 per quality rank above Fine (Superior +4, Masterwork +8). +5 for winning the haggle.
          </p>
          <p style="color: var(--ink-dim); font-size: 0.88rem;">
            Reputation is tracked <strong>per race</strong>. Each market tier requires minimum reputation with specific races to unlock.
          </p>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">

        <div class="panel">
          <div class="panel-header"><h3>🛒 Buying Goods</h3></div>
          <p style="color: var(--ink-dim);">
            On the Market tab, browse available goods and click one to buy it. Buying triggers the <strong style="color: var(--gold);">Reaction Time minigame</strong> — wait for "Buy!" to appear (2-7 seconds), then click or press Space as fast as you can. The faster your reaction, the higher the item quality.
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
