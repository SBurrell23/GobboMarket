import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameState } from '../../core/GameState.js';
import { eventBus } from '../../core/EventBus.js';

describe('GameState', () => {
  let state: GameState;

  beforeEach(() => {
    state = new GameState();
    eventBus.clear();
  });

  describe('coins', () => {
    it('should start with 50 coins', () => {
      expect(state.coins).toBe(50);
    });

    it('should add coins', () => {
      state.addCoins(100, 'test');
      expect(state.coins).toBe(150);
    });

    it('should not add negative coins', () => {
      state.addCoins(-10, 'test');
      expect(state.coins).toBe(50);
    });

    it('should clamp coins to MAX_COINS', () => {
      state.addCoins(2_000_000, 'test');
      expect(state.coins).toBe(1_000_000);
      expect(state.hasMaxCoins).toBe(true);
    });

    it('should spend coins', () => {
      state.addCoins(100, 'test');
      const success = state.spendCoins(50, 'item');
      expect(success).toBe(true);
      expect(state.coins).toBe(100);
    });

    it('should not spend more than available', () => {
      const success = state.spendCoins(100, 'item');
      expect(success).toBe(false);
      expect(state.coins).toBe(50);
    });

    it('should emit events on coin changes', () => {
      const earnedCb = vi.fn();
      const changedCb = vi.fn();
      eventBus.on('coins:earned', earnedCb);
      eventBus.on('coins:changed', changedCb);

      state.addCoins(100, 'sale');
      expect(earnedCb).toHaveBeenCalledWith({ amount: 100, source: 'sale' });
      expect(changedCb).toHaveBeenCalledWith({ amount: 100, total: 150 });
    });

    it('should emit events on coin spending', () => {
      const spentCb = vi.fn();
      eventBus.on('coins:spent', spentCb);
      state.spendCoins(30, 'upgrade');
      expect(spentCb).toHaveBeenCalledWith({ amount: 30, item: 'upgrade' });
    });
  });

  describe('reputation', () => {
    it('should start with 0 reputation', () => {
      expect(state.reputation).toBe(0);
    });

    it('should add reputation', () => {
      state.addReputation(10);
      expect(state.reputation).toBe(10);
    });

    it('should not add negative reputation', () => {
      state.addReputation(-5);
      expect(state.reputation).toBe(0);
    });
  });

  describe('tiers', () => {
    it('should start at tier 0', () => {
      expect(state.currentTier).toBe(0);
      expect(state.tierName).toBe('Muddy Alley');
    });

    it('should unlock tier when coins and reputation meet thresholds', () => {
      const tierCb = vi.fn();
      eventBus.on('tier:unlocked', tierCb);

      state.addCoins(200, 'test');
      state.addReputation(20);

      expect(state.currentTier).toBe(1);
      expect(tierCb).toHaveBeenCalledWith({ tier: 1, name: 'Back Alley Bazaar' });
    });

    it('should skip multiple tiers when thresholds are exceeded', () => {
      const tierCb = vi.fn();
      eventBus.on('tier:unlocked', tierCb);

      state.addCoins(500, 'test');
      state.addReputation(50);

      expect(state.currentTier).toBe(2);
      expect(tierCb).toHaveBeenCalledTimes(2);
    });

    it('should not unlock tier with only coins', () => {
      state.addCoins(200, 'test');
      expect(state.currentTier).toBe(0);
    });
  });

  describe('inventory', () => {
    it('should add items to inventory', () => {
      const item = {
        id: 'item-1',
        goodsId: 'iron_dagger',
        quality: 3,
        enchanted: false,
        enchantMultiplier: 1,
        basePrice: 10,
      };
      const added = state.addToInventory(item);
      expect(added).toBe(true);
      expect(state.inventory).toHaveLength(1);
    });

    it('should not exceed stall slots', () => {
      for (let i = 0; i < 4; i++) {
        state.addToInventory({
          id: `item-${i}`,
          goodsId: 'iron_dagger',
          quality: 2,
          enchanted: false,
          enchantMultiplier: 1,
          basePrice: 10,
        });
      }
      const added = state.addToInventory({
        id: 'item-5',
        goodsId: 'iron_dagger',
        quality: 2,
        enchanted: false,
        enchantMultiplier: 1,
        basePrice: 10,
      });
      expect(added).toBe(false);
      expect(state.inventory).toHaveLength(4);
    });

    it('should remove items from inventory', () => {
      state.addToInventory({
        id: 'item-1',
        goodsId: 'iron_dagger',
        quality: 2,
        enchanted: false,
        enchantMultiplier: 1,
        basePrice: 10,
      });
      const removed = state.removeFromInventory('item-1');
      expect(removed).not.toBeNull();
      expect(state.inventory).toHaveLength(0);
    });

    it('should return null when removing non-existent item', () => {
      const removed = state.removeFromInventory('nonexistent');
      expect(removed).toBeNull();
    });
  });

  describe('upgrades and recipes', () => {
    it('should track upgrades', () => {
      expect(state.hasUpgrade('forge_hammer')).toBe(false);
      state.addUpgrade('forge_hammer');
      expect(state.hasUpgrade('forge_hammer')).toBe(true);
    });

    it('should not duplicate upgrades', () => {
      state.addUpgrade('forge_hammer');
      state.addUpgrade('forge_hammer');
      expect(state.data.upgrades).toHaveLength(1);
    });

    it('should start with default recipes', () => {
      expect(state.hasRecipe('iron_dagger')).toBe(true);
      expect(state.hasRecipe('wooden_shield')).toBe(true);
      expect(state.hasRecipe('herb_pouch')).toBe(true);
    });

    it('should unlock new recipes', () => {
      state.unlockRecipe('enchanted_sword');
      expect(state.hasRecipe('enchanted_sword')).toBe(true);
    });
  });

  describe('serialization', () => {
    it('should serialize and deserialize state', () => {
      state.addCoins(200, 'test');
      state.addReputation(30);
      state.addUpgrade('forge_hammer');

      const json = state.serialize();
      const newState = new GameState();
      const success = newState.deserialize(json);

      expect(success).toBe(true);
      expect(newState.coins).toBe(250);
      expect(newState.reputation).toBe(30);
      expect(newState.hasUpgrade('forge_hammer')).toBe(true);
    });

    it('should reject invalid JSON', () => {
      const success = state.deserialize('not json');
      expect(success).toBe(false);
    });

    it('should reject missing required fields', () => {
      const success = state.deserialize('{"name": "test"}');
      expect(success).toBe(false);
    });
  });

  describe('reset', () => {
    it('should reset to default state', () => {
      state.addCoins(500, 'test');
      state.addReputation(100);
      state.addUpgrade('forge_hammer');
      state.reset();

      expect(state.coins).toBe(50);
      expect(state.reputation).toBe(0);
      expect(state.hasUpgrade('forge_hammer')).toBe(false);
    });
  });
});
