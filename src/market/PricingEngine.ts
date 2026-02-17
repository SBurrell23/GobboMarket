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

  const categoryBonus = goods && customer.desiredCategory === goods.category ? 1.25 : 1.0;
  const budgetMult = customer.budgetMultiplier;

  // Sturdy Workbench: +10% sell price on crafted items
  const workbenchBonus = (goods?.craftable && gameState.hasUpgrade('sturdy_workbench')) ? 1.10 : 1.0;
  // Grand Emporium: +15% on all goods
  const emporiumBonus = gameState.hasUpgrade('grand_emporium') ? 1.15 : 1.0;

  const finalPrice = Math.round(
    basePrice * qualityMult * enchantMult * categoryBonus * budgetMult * haggleMultiplier * workbenchBonus * emporiumBonus
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
  const tierDiscount = 1 - tier * 0.05;
  const guildDiscount = gameState.hasUpgrade('merchant_guild') ? 0.90 : 1.0;
  return Math.max(1, Math.round(goods.materialCost * tierDiscount * guildDiscount));
}

export function estimateValue(item: InventoryItem): number {
  const qualityMult = QUALITY_MULTIPLIERS[Math.min(item.quality, QUALITY_MULTIPLIERS.length - 1)];
  const enchantMult = item.enchanted ? item.enchantMultiplier : 1.0;
  return Math.round(item.basePrice * qualityMult * enchantMult);
}
