import { describe, it, expect } from 'vitest';
import { getGoodsById, getGoodsByTier, getCraftableGoods, getBuyableGoods, getAllGoods } from '../../market/Goods.js';

describe('Goods', () => {
  it('should return goods by id', () => {
    const dagger = getGoodsById('iron_dagger');
    expect(dagger).toBeDefined();
    expect(dagger!.name).toBe('Iron Dagger');
    expect(dagger!.tier).toBe(0);
  });

  it('should return undefined for unknown id', () => {
    expect(getGoodsById('nonexistent')).toBeUndefined();
  });

  it('should return goods filtered by tier', () => {
    const tier0 = getGoodsByTier(0);
    expect(tier0.length).toBeGreaterThan(0);
    expect(tier0.every(g => g.tier <= 0)).toBe(true);

    const tier1 = getGoodsByTier(1);
    expect(tier1.length).toBeGreaterThan(tier0.length);
    expect(tier1.every(g => g.tier <= 1)).toBe(true);
  });

  it('should return craftable goods', () => {
    const craftable = getCraftableGoods(0, ['iron_dagger', 'wooden_shield', 'herb_pouch']);
    expect(craftable.length).toBe(3);
    expect(craftable.every(g => g.craftable)).toBe(true);
  });

  it('should return buyable (non-craftable) goods', () => {
    const buyable = getBuyableGoods(0);
    expect(buyable.length).toBeGreaterThan(0);
    expect(buyable.every(g => !g.craftable)).toBe(true);
  });

  it('should have all goods with positive base prices', () => {
    const all = getAllGoods();
    expect(all.length).toBeGreaterThan(0);
    expect(all.every(g => g.basePrice > 0)).toBe(true);
  });

  it('should have material cost less than base price for all goods', () => {
    const all = getAllGoods();
    for (const g of all) {
      expect(g.materialCost).toBeLessThan(g.basePrice);
    }
  });

  it('should have goods for all 9 tiers', () => {
    for (let tier = 0; tier <= 8; tier++) {
      const goods = getAllGoods().filter(g => g.tier === tier);
      expect(goods.length).toBeGreaterThan(0);
    }
  });
});
