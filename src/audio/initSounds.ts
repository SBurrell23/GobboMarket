import { eventBus } from '../core/EventBus.js';
import { soundManager } from './SoundManager.js';

export function initSounds(): void {
  soundManager.loadSettings();
  soundManager.startBackgroundMusic();

  eventBus.on('customer:arrived', () => soundManager.play('customer_arrive'));
  eventBus.on('customer:left', () => soundManager.play('customer_leave'));
  eventBus.on('coins:earned', () => soundManager.play('gold_earned'));
  eventBus.on('minigame:started', ({ type }) => {
    if (type === 'haggle') soundManager.play('haggle_open');
    if (type === 'runecraft') soundManager.play('enchant_open');
  });
  eventBus.on('minigame:completed', ({ type, score }) => {
    if (type === 'forge') soundManager.play('craft_complete');
    if (type === 'runecraft' && score > 0) soundManager.play('enchant_complete');
  });
  eventBus.on('milestone:reached', () => soundManager.play('milestone'));
  eventBus.on('tier:unlocked', () => soundManager.play('tier_unlock'));
  eventBus.on('upgrade:purchased', () => soundManager.play('upgrade_purchase'));
  eventBus.on('recipe:unlocked', () => soundManager.play('upgrade_purchase'));
  eventBus.on('screen:changed', () => soundManager.play('tab_click'));
  eventBus.on('cooldown:ready', () => soundManager.play('cooldown_ready'));
  eventBus.on('item:bought', () => soundManager.play('good_bought'));
}

export { soundManager };
