import { eventBus } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';
import { soundManager } from './SoundManager.js';

let currentScreen = 'market';

export function initSounds(): void {
  soundManager.loadSettings();
  // Music starts on first user interaction (see main.ts onStart) - browsers block autoplay before that

  eventBus.on('screen:changed', ({ screen }) => { currentScreen = screen; });
  eventBus.on('customer:arrived', () => {
    if (currentScreen === 'market') soundManager.play('customer_arrive', { volume: 0.5 });
  });
  eventBus.on('customer:left', () => {
    if (currentScreen === 'market') soundManager.play('customer_leave', { volume: 0.5 });
  });
  eventBus.on('coins:earned', () => soundManager.play('gold_earned'));
  eventBus.on('minigame:started', ({ type }) => {
    if (type === 'haggle') soundManager.play('haggle_open');
    if (type === 'runecraft') soundManager.play('enchant_open');
  });
  eventBus.on('minigame:completed', ({ type, score }) => {
    if (type === 'runecraft' && score > 0) soundManager.play('enchant_complete');
  });
  eventBus.on('milestone:reached', () => soundManager.play('milestone'));
  eventBus.on('tier:unlocked', () => soundManager.play('tier_unlock'));
  eventBus.on('upgrade:purchased', () => soundManager.play('upgrade_purchase'));
  eventBus.on('recipe:unlocked', () => soundManager.play('upgrade_purchase'));
  eventBus.on('screen:changed', () => soundManager.play('tab_click'));
  eventBus.on('cooldown:ready', () => soundManager.play('cooldown_ready'));
  eventBus.on('item:bought', () => soundManager.play('good_bought'));
  eventBus.on('music:track_started', ({ filename }) => {
    gameState.recordSongHeard(filename);
  });
}

export { soundManager };
