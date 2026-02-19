import { gameState } from '../core/GameState.js';
import { STALL_BASE_SLOTS, STALL_SLOT_UPGRADE_COST_BASE, STALL_SLOT_UPGRADE_COST_MULT, TIER_THRESHOLDS, UPGRADE_COST_CAP } from '../core/constants.js';

export interface UpgradeDefinition {
  id: string;
  name: string;
  description: string;
  tier: number;
  maxRank: number;
  icon: string;
  costForRank(rank: number): number;
}

function widerStallCost(): number {
  const currentSlots = gameState.stallSlots;
  const extraSlots = currentSlots - STALL_BASE_SLOTS;
  return Math.round(STALL_SLOT_UPGRADE_COST_BASE * Math.pow(STALL_SLOT_UPGRADE_COST_MULT, extraSlots));
}

/** Cost for rank R of a tier-T upgrade: uses tier thresholds, capped so upgrades stay affordable vs 1M goal. */
function tierScaledCost(tier: number, rank: number): number {
  const idx = Math.min(tier + rank, TIER_THRESHOLDS.length - 1);
  return Math.min(TIER_THRESHOLDS[idx], UPGRADE_COST_CAP);
}

export const UPGRADE_DEFINITIONS: UpgradeDefinition[] = [
  // Tier 0 (Muddy Alley)
  {
    id: 'wider_stall',
    name: 'Wider Stall',
    description: '+1 stall slot',
    tier: 0,
    maxRank: Infinity,
    icon: '🏗️',
    costForRank: () => widerStallCost(),
  },
  {
    id: 'market_sign',
    name: 'Market Sign',
    description: '+5% customer arrival speed',
    tier: 0,
    maxRank: 5,
    icon: '🪧',
    costForRank: (rank) => tierScaledCost(0, rank),
  },
  {
    id: 'sturdy_workbench',
    name: 'Sturdy Workbench',
    description: '+5% sell price on crafted items',
    tier: 0,
    maxRank: 6,
    icon: '🪑',
    costForRank: (rank) => tierScaledCost(0, rank),
  },
  // Tier 1 (Back Alley Bazaar)
  {
    id: 'thick_gloves',
    name: 'Thick Gloves',
    description: '+0.05 forge sweet spot width',
    tier: 1,
    maxRank: 5,
    icon: '🧤',
    costForRank: (rank) => tierScaledCost(1, rank),
  },
  {
    id: 'hagglers_dice',
    name: "Haggler's Dice",
    description: 'Customer d20 -1',
    tier: 1,
    maxRank: 5,
    icon: '🎲',
    costForRank: (rank) => tierScaledCost(1, rank),
  },
  // Tier 2 (Market Square)
  {
    id: 'forge_bellows',
    name: 'Forge Bellows',
    description: 'Meter 10% slower',
    tier: 2,
    maxRank: 4,
    icon: '🔥',
    costForRank: (rank) => tierScaledCost(2, rank),
  },
  {
    id: 'rune_library',
    name: 'Rune Library',
    description: '6 fewer shuffles',
    tier: 2,
    maxRank: 4,
    icon: '📚',
    costForRank: (rank) => tierScaledCost(2, rank),
  },
  // Tier 3 (Trader's Row)
  {
    id: 'quick_hands',
    name: 'Quick Hands',
    description: '-6% cooldown on T1-2 items',
    tier: 3,
    maxRank: 5,
    icon: '🤲',
    costForRank: (rank) => tierScaledCost(3, rank),
  },
  {
    id: 'keen_eye',
    name: 'Keen Eye',
    description: '+4 seconds on timed minigames',
    tier: 3,
    maxRank: 5,
    icon: '👁️',
    costForRank: (rank) => tierScaledCost(3, rank),
  },
  // Tier 4 (Merchant Quarter)
  {
    id: 'auctioneers_reflex',
    name: "Auctioneer's Reflex",
    description: 'Reaction thresholds eased by 30ms',
    tier: 4,
    maxRank: 4,
    icon: '⚡',
    costForRank: (rank) => tierScaledCost(4, rank),
  },
  {
    id: 'bargain_specialist',
    name: 'Bargain Specialist',
    description: '+15% sell on T1-3 items',
    tier: 4,
    maxRank: 3,
    icon: '🏷️',
    costForRank: (rank) => tierScaledCost(4, rank),
  },
  // Tier 5 (Guild District)
  {
    id: 'supply_chain',
    name: 'Supply Chain',
    description: '-7% cooldown on bought goods',
    tier: 5,
    maxRank: 4,
    icon: '📦',
    costForRank: (rank) => tierScaledCost(5, rank),
  },
  {
    id: 'enchanting_table',
    name: 'Enchanting Table',
    description: '+15% enchant multiplier',
    tier: 5,
    maxRank: 4,
    icon: '✨',
    costForRank: (rank) => tierScaledCost(5, rank),
  },
  // Tier 6 (Royal Bazaar)
  {
    id: 'efficient_workshop',
    name: 'Efficient Workshop',
    description: '-8% cooldown on forged items',
    tier: 6,
    maxRank: 4,
    icon: '🏭',
    costForRank: (rank) => tierScaledCost(6, rank),
  },
  // Tier 7 (Diamond Exchange)
  {
    id: 'merchant_guild',
    name: 'Merchant Guild Card',
    description: '-8% material costs',
    tier: 7,
    maxRank: 4,
    icon: '📜',
    costForRank: (rank) => tierScaledCost(7, rank),
  },
  // Tier 8 (Grand Exchange)
  {
    id: 'master_supplier',
    name: 'Master Supplier',
    description: '-10% cooldown on all items',
    tier: 8,
    maxRank: 5,
    icon: '🚀',
    costForRank: (rank) => tierScaledCost(8, rank),
  },
];

export function getAvailableUpgrades(): Array<UpgradeDefinition & { currentRank: number; nextCost: number }> {
  const tier = gameState.currentTier;
  return UPGRADE_DEFINITIONS.filter((u) => u.tier <= tier)
    .map((u) => {
      let currentRank: number;
      let nextCost: number;
      if (u.id === 'wider_stall') {
        currentRank = gameState.stallSlots - STALL_BASE_SLOTS;
        nextCost = u.costForRank(0);
      } else {
        currentRank = gameState.getUpgradeRank(u.id);
        const canRankUp = currentRank < u.maxRank;
        nextCost = canRankUp ? u.costForRank(currentRank + 1) : 0;
      }
      return { ...u, currentRank, nextCost };
    })
    .filter((u) => {
      if (u.id === 'wider_stall') return true;
      return u.currentRank < u.maxRank;
    });
}

export function purchaseUpgrade(upgradeId: string): boolean {
  const def = UPGRADE_DEFINITIONS.find((u) => u.id === upgradeId);
  if (!def) return false;

  let cost: number;
  if (def.id === 'wider_stall') {
    cost = def.costForRank(0);
  } else {
    const currentRank = gameState.getUpgradeRank(upgradeId);
    if (currentRank >= def.maxRank) return false;
    cost = def.costForRank(currentRank + 1);
  }
  if (!gameState.spendCoins(cost, def.name)) return false;

  if (def.id === 'wider_stall') {
    gameState.incrementStallSlots();
  } else {
    gameState.addUpgradeRank(upgradeId);
  }
  return true;
}
