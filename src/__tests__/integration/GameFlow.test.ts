import { describe, it, expect, beforeEach, vi } from 'vitest';
import { gameState, type InventoryItem } from '../../core/GameState.js';
import { eventBus } from '../../core/EventBus.js';
import { SaveSystem } from '../../core/SaveSystem.js';
import { calculateSellPrice, calculateBuyPrice } from '../../market/PricingEngine.js';
import { createCustomer } from '../../market/Customer.js';
import { checkMilestones, getCompletedMilestones } from '../../progression/Milestones.js';
import { awardReputation } from '../../progression/Reputation.js';
import { purchaseUpgrade } from '../../progression/Upgrades.js';
import { getGoodsById } from '../../market/Goods.js';

describe('GameFlow Integration', () => {
  beforeEach(() => {
    gameState.reset();
    eventBus.clear();
    localStorage.clear();
  });

  describe('Craft and sell flow', () => {
    it('should buy materials, create inventory item, sell to customer, and increase coins', () => {
      const initialCoins = gameState.coins;
      expect(initialCoins).toBe(50);

      // 1. Buy materials for iron_dagger (materialCost: 8)
      const materialCost = calculateBuyPrice('iron_dagger', gameState.currentTier);
      expect(materialCost).toBe(8);

      const spent = gameState.spendCoins(materialCost, 'iron_dagger materials');
      expect(spent).toBe(true);
      expect(gameState.coins).toBe(initialCoins - materialCost);

      // 2. Create inventory item (simulate crafting)
      const goods = getGoodsById('iron_dagger')!;
      const item: InventoryItem = {
        id: 'crafted-1',
        goodsId: 'iron_dagger',
        quality: 2,
        enchanted: false,
        enchantMultiplier: 1,
        basePrice: goods.basePrice,
      };
      const added = gameState.addToInventory(item);
      expect(added).toBe(true);
      gameState.recordCraft();

      // 3. Sell to customer via pricing engine
      const customer = createCustomer('human');
      // Force desired category to weapon so we get the bonus
      customer.desiredCategory = 'weapon';
      const priceCalc = calculateSellPrice(item, customer);
      const sellPrice = priceCalc.finalPrice;

      gameState.addCoins(sellPrice, 'sale');
      const removed = gameState.removeFromInventory(item.id);
      expect(removed).not.toBeNull();
      gameState.recordSale();
      awardReputation(item.quality, 'settle', 'human');

      // 4. Verify coins increased
      expect(gameState.coins).toBeGreaterThan(initialCoins);
      expect(gameState.inventory).toHaveLength(0);
    });
  });

  describe('Progression flow', () => {
    it('should advance tier when coins and race reputation meet thresholds', () => {
      expect(gameState.currentTier).toBe(0);

      // Tier 1 requires: 150 coins, goblin: 50, human: 50
      gameState.addCoins(200, 'test');
      expect(gameState.currentTier).toBe(0);

      const tierCb = vi.fn();
      eventBus.on('tier:unlocked', tierCb);

      gameState.addRaceReputation('goblin', 40);
      expect(gameState.currentTier).toBe(0); // Still need human rep
      gameState.addRaceReputation('human', 40);

      expect(gameState.currentTier).toBe(1);
      expect(tierCb).toHaveBeenCalledWith({ tier: 1, name: 'Back Alley Bazaar' });
    });

    it('should not unlock tier with only coins', () => {
      gameState.addCoins(200, 'test');
      expect(gameState.currentTier).toBe(0);
    });

    it('should not unlock tier with only reputation', () => {
      gameState.addRaceReputation('goblin', 75);
      gameState.addRaceReputation('human', 75);
      expect(gameState.currentTier).toBe(0);
    });
  });

  describe('Milestone tracking', () => {
    it('should detect first sale milestone', () => {
      gameState.recordSale();
      const newMilestones = checkMilestones();
      expect(newMilestones.some((m) => m.id === 'first_sale')).toBe(true);
      expect(gameState.hasMilestone('first_sale')).toBe(true);
    });

    it('should detect first craft milestone', () => {
      gameState.recordCraft();
      const newMilestones = checkMilestones();
      expect(newMilestones.some((m) => m.id === 'first_craft')).toBe(true);
      expect(gameState.hasMilestone('first_craft')).toBe(true);
    });

    it('should detect coin threshold milestones', () => {
      gameState.addCoins(1000, 'test');
      const newMilestones = checkMilestones();
      expect(newMilestones.some((m) => m.id === 'coins_1000')).toBe(true);
      expect(getCompletedMilestones().some((m) => m.id === 'coins_1000')).toBe(true);
    });

    it('should track multiple milestones across actions', () => {
      gameState.recordCraft();
      gameState.recordSale();
      gameState.addCoins(1000, 'test');
      checkMilestones();

      const completed = getCompletedMilestones();
      expect(completed.some((m) => m.id === 'first_craft')).toBe(true);
      expect(completed.some((m) => m.id === 'first_sale')).toBe(true);
      expect(completed.some((m) => m.id === 'coins_1000')).toBe(true);
    });
  });

  describe('Save/load roundtrip', () => {
    it('should restore state correctly after save, reset, and load', () => {
      const saveSystem = new SaveSystem();

      // Modify game state
      gameState.addCoins(500, 'test');
      gameState.addRaceReputation('goblin', 50);
      gameState.addRaceReputation('human', 25);
      gameState.addUpgradeRank('forge_bellows');
      gameState.addToInventory({
        id: 'saved-item',
        goodsId: 'iron_dagger',
        quality: 3,
        enchanted: false,
        enchantMultiplier: 1,
        basePrice: 15,
      });

      const savedCoins = gameState.coins;
      const savedReputation = gameState.reputation;
      const savedUpgradeRanks = { ...gameState.data.upgradeRanks };
      const savedInventoryLength = gameState.inventory.length;

      // Save
      const saveSuccess = saveSystem.save();
      expect(saveSuccess).toBe(true);

      // Reset (simulate fresh load)
      gameState.reset();
      expect(gameState.coins).toBe(50);
      expect(gameState.reputation).toBe(0);
      expect(gameState.getUpgradeRank('forge_bellows')).toBe(0);
      expect(gameState.inventory).toHaveLength(0);

      // Load
      const loadSuccess = saveSystem.load();
      expect(loadSuccess).toBe(true);

      // Verify state restored
      expect(gameState.coins).toBe(savedCoins);
      expect(gameState.reputation).toBe(savedReputation);
      expect(gameState.getRaceReputation('goblin')).toBe(50);
      expect(gameState.getRaceReputation('human')).toBe(25);
      expect(gameState.getUpgradeRank('forge_bellows')).toBe(1);
      expect(gameState.data.upgradeRanks).toEqual(savedUpgradeRanks);
      expect(gameState.inventory).toHaveLength(savedInventoryLength);
    });
  });

  describe('Upgrade purchase flow', () => {
    it('should buy upgrade, record it, and deduct coins', () => {
      // forge_bellows is tier 2, rank 1 costs 1500 (tier 3 threshold). T2 requires: 500 coins, goblin: 75, human: 75, elf: 40
      gameState.addCoins(2000, 'test');
      gameState.addRaceReputation('goblin', 75);
      gameState.addRaceReputation('human', 75);
      gameState.addRaceReputation('elf', 40);

      const coinsBefore = gameState.coins;
      expect(gameState.getUpgradeRank('forge_bellows')).toBe(0);

      const success = purchaseUpgrade('forge_bellows');
      expect(success).toBe(true);

      expect(gameState.getUpgradeRank('forge_bellows')).toBe(1);
      expect(gameState.coins).toBe(coinsBefore - 1500);
    });

    it('should fail to purchase upgrade without enough coins', () => {
      gameState.addCoins(50, 'test');
      gameState.addRaceReputation('goblin', 50);
      gameState.addRaceReputation('human', 50);

      const success = purchaseUpgrade('forge_bellows');
      expect(success).toBe(false);
      expect(gameState.getUpgradeRank('forge_bellows')).toBe(0);
      expect(gameState.coins).toBe(100);
    });

    it('should allow rank-up purchases up to maxRank', () => {
      gameState.addCoins(50000, 'test');
      gameState.addRaceReputation('goblin', 75);
      gameState.addRaceReputation('human', 75);
      gameState.addRaceReputation('elf', 40);

      const first = purchaseUpgrade('forge_bellows');
      const second = purchaseUpgrade('forge_bellows');
      expect(first).toBe(true);
      expect(second).toBe(true);
      expect(gameState.getUpgradeRank('forge_bellows')).toBe(2);
    });
  });
});
