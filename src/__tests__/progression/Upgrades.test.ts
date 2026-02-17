import { describe, it, expect, beforeEach } from 'vitest';
import { getAvailableUpgrades, purchaseUpgrade, UPGRADES } from '../../progression/Upgrades.js';
import { gameState } from '../../core/GameState.js';
import { eventBus } from '../../core/EventBus.js';

describe('Upgrades', () => {
  beforeEach(() => {
    gameState.reset();
    eventBus.clear();
  });

  it('should return upgrades for current tier', () => {
    const available = getAvailableUpgrades();
    expect(available.length).toBeGreaterThan(0);
    expect(available.every(u => u.tier <= gameState.currentTier || u.id === 'stall_slot_1')).toBe(true);
  });

  it('should purchase stall slot upgrade', () => {
    gameState.addCoins(200, 'test');
    const slotsBefore = gameState.stallSlots;
    const success = purchaseUpgrade('stall_slot_1');
    expect(success).toBe(true);
    expect(gameState.stallSlots).toBe(slotsBefore + 1);
  });

  it('should not purchase upgrade without enough coins', () => {
    const success = purchaseUpgrade('forge_bellows');
    expect(success).toBe(false);
  });

  it('should not purchase same non-repeatable upgrade twice', () => {
    gameState.addCoins(500, 'test');
    purchaseUpgrade('forge_bellows');
    gameState.addCoins(500, 'test');
    const success = purchaseUpgrade('forge_bellows');
    expect(success).toBe(false);
  });

  it('should allow repeatable stall slot upgrades', () => {
    gameState.addCoins(10000, 'test');
    purchaseUpgrade('stall_slot_1');
    const success = purchaseUpgrade('stall_slot_1');
    expect(success).toBe(true);
    expect(gameState.stallSlots).toBe(6);
  });

  it('should have upgrades for all tiers', () => {
    const tiers = new Set(UPGRADES.map(u => u.tier));
    expect(tiers.size).toBeGreaterThanOrEqual(4);
  });
});
