import { describe, it, expect } from 'vitest';
import { calculateSellPrice, calculateBuyPrice, estimateValue } from '../../market/PricingEngine.js';
import type { InventoryItem } from '../../core/GameState.js';
import type { Customer } from '../../market/Customer.js';

function makeItem(overrides: Partial<InventoryItem> = {}): InventoryItem {
  return {
    id: 'test-item',
    goodsId: 'iron_dagger',
    quality: 2,
    enchanted: false,
    enchantMultiplier: 1,
    basePrice: 15,
    ...overrides,
  };
}

function makeCustomer(overrides: Partial<Customer> = {}): Customer {
  return {
    id: 'test-customer',
    type: 'human',
    name: 'Test',
    icon: '🧑',
    desiredCategory: 'weapon',
    patience: 5,
    haggleSkill: 0.5,
    budgetMultiplier: 1.0,
    arrivedAt: Date.now(),
    ...overrides,
  };
}

describe('PricingEngine', () => {
  describe('calculateSellPrice', () => {
    it('should calculate base price with quality multiplier', () => {
      const result = calculateSellPrice(makeItem({ quality: 2 }), makeCustomer());
      expect(result.basePrice).toBe(15);
      expect(result.qualityMultiplier).toBe(1.0);
      expect(result.finalPrice).toBeGreaterThan(0);
    });

    it('should apply category bonus when customer wants that category', () => {
      const matching = calculateSellPrice(
        makeItem(),
        makeCustomer({ desiredCategory: 'weapon' })
      );
      const nonMatching = calculateSellPrice(
        makeItem(),
        makeCustomer({ desiredCategory: 'food' })
      );
      expect(matching.categoryBonus).toBe(1.25);
      expect(nonMatching.categoryBonus).toBe(1.0);
      expect(matching.finalPrice).toBeGreaterThan(nonMatching.finalPrice);
    });

    it('should apply enchant multiplier', () => {
      const normal = calculateSellPrice(makeItem(), makeCustomer());
      const enchanted = calculateSellPrice(
        makeItem({ enchanted: true, enchantMultiplier: 1.5 }),
        makeCustomer()
      );
      expect(enchanted.finalPrice).toBeGreaterThan(normal.finalPrice);
    });

    it('should apply haggle multiplier', () => {
      const base = calculateSellPrice(makeItem(), makeCustomer(), 1.0);
      const haggled = calculateSellPrice(makeItem(), makeCustomer(), 1.5);
      expect(haggled.finalPrice).toBeGreaterThan(base.finalPrice);
    });

    it('should apply budget multiplier from customer type', () => {
      const normal = calculateSellPrice(makeItem(), makeCustomer({ budgetMultiplier: 1.0 }));
      const noble = calculateSellPrice(makeItem(), makeCustomer({ budgetMultiplier: 1.5 }));
      expect(noble.finalPrice).toBeGreaterThan(normal.finalPrice);
    });

    it('should never return price less than 1', () => {
      const result = calculateSellPrice(
        makeItem({ quality: 0, basePrice: 1 }),
        makeCustomer({ budgetMultiplier: 0.1 }),
        0.1
      );
      expect(result.finalPrice).toBeGreaterThanOrEqual(1);
    });

    it('should reward higher quality items', () => {
      const shoddy = calculateSellPrice(makeItem({ quality: 0 }), makeCustomer());
      const masterwork = calculateSellPrice(makeItem({ quality: 4 }), makeCustomer());
      expect(masterwork.finalPrice).toBeGreaterThan(shoddy.finalPrice);
    });
  });

  describe('calculateBuyPrice', () => {
    it('should return material cost for tier 0', () => {
      const price = calculateBuyPrice('iron_dagger', 0);
      expect(price).toBe(8);
    });

    it('should apply tier discount', () => {
      const tier0 = calculateBuyPrice('iron_dagger', 0);
      const tier2 = calculateBuyPrice('iron_dagger', 2);
      expect(tier2).toBeLessThan(tier0);
    });

    it('should return 0 for unknown goods', () => {
      expect(calculateBuyPrice('nonexistent', 0)).toBe(0);
    });
  });

  describe('estimateValue', () => {
    it('should estimate value based on quality and enchant', () => {
      const plain = estimateValue(makeItem({ quality: 2 }));
      const enchanted = estimateValue(makeItem({ quality: 2, enchanted: true, enchantMultiplier: 1.5 }));
      expect(enchanted).toBeGreaterThan(plain);
    });
  });
});
