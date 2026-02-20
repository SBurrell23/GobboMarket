import { QUALITY_MULTIPLIERS } from '../core/constants.js';
import { gameState, type InventoryItem } from '../core/GameState.js';
import type { Customer } from './Customer.js';
import { getGoodsById } from './Goods.js';

export interface PriceCalculation {
  basePrice: number;
  qualityMultiplier: number;
  enchantMultiplier: number;
  categoryBonus: number;
  budgetMultiplier: number;
  finalPrice: number;
}

export function calculateSellPrice(
  item: InventoryItem,
  customer: Customer,
  haggleMultiplier: number = 1.0,
): PriceCalculation {
  const goods = getGoodsById(item.goodsId);
  const basePrice = goods?.basePrice ?? item.basePrice;

  const qualityMult = QUALITY_MULTIPLIERS[Math.min(item.quality, QUALITY_MULTIPLIERS.length - 1)];
  const enchantMult = item.enchanted ? item.enchantMultiplier : 1.0;

  const categoryBonus = goods
    ? (customer.desiredCategory === goods.category ? 1.25
      : customer.refusedCategory === goods.category ? 0.5
      : 1.0)
    : 1.0;
  const budgetMult = customer.budgetMultiplier;

  const workbenchBonus = goods?.craftable
    ? 1 + gameState.getUpgradeRank('sturdy_workbench') * 0.05
    : 1.0;

  const finalPrice = Math.round(
    basePrice * qualityMult * enchantMult * categoryBonus * budgetMult * haggleMultiplier * workbenchBonus
  );

  return {
    basePrice,
    qualityMultiplier: qualityMult,
    enchantMultiplier: enchantMult,
    categoryBonus,
    budgetMultiplier: budgetMult,
    finalPrice: Math.max(1, finalPrice),
  };
}

export function calculateBuyPrice(goodsId: string, tier: number): number {
  const goods = getGoodsById(goodsId);
  if (!goods) return 0;
  const tierDiscount = 1 - tier * 0.03;
  const guildDiscount = 1 - gameState.getUpgradeRank('merchant_guild') * 0.08;
  return Math.max(1, Math.round(goods.materialCost * tierDiscount * guildDiscount));
}

export function estimateValue(item: InventoryItem): number {
  const qualityMult = QUALITY_MULTIPLIERS[Math.min(item.quality, QUALITY_MULTIPLIERS.length - 1)];
  const enchantMult = item.enchanted ? item.enchantMultiplier : 1.0;
  return Math.round(item.basePrice * qualityMult * enchantMult);
}
