import { describe, it, expect, beforeEach } from 'vitest';
import { getAvailableUpgrades, purchaseUpgrade, UPGRADE_DEFINITIONS } from '../../progression/Upgrades.js';
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
    expect(available.every(u => u.tier <= gameState.currentTier || u.id === 'wider_stall')).toBe(true);
  });

  it('should purchase wider stall upgrade', () => {
    gameState.addCoins(200, 'test');
    const slotsBefore = gameState.stallSlots;
    const success = purchaseUpgrade('wider_stall');
    expect(success).toBe(true);
    expect(gameState.stallSlots).toBe(slotsBefore + 1);
  });

  it('should not purchase upgrade without enough coins', () => {
    const success = purchaseUpgrade('forge_bellows');
    expect(success).toBe(false);
  });

  it('should allow rank-up purchases up to maxRank', () => {
    gameState.addCoins(50000, 'test');
    gameState.addRaceReputation('goblin', 75);
    gameState.addRaceReputation('human', 75);
    gameState.addRaceReputation('elf', 40);

    purchaseUpgrade('forge_bellows');
    const success = purchaseUpgrade('forge_bellows');
    expect(success).toBe(true);
    expect(gameState.getUpgradeRank('forge_bellows')).toBe(2);
  });

  it('should allow repeatable wider_stall upgrades', () => {
    gameState.addCoins(10000, 'test');
    purchaseUpgrade('wider_stall');
    const success = purchaseUpgrade('wider_stall');
    expect(success).toBe(true);
    expect(gameState.stallSlots).toBe(7);
  });

  it('should have upgrades for all tiers', () => {
    const tiers = new Set(UPGRADE_DEFINITIONS.map(u => u.tier));
    expect(tiers.size).toBeGreaterThanOrEqual(7);
  });
});
