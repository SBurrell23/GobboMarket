import { gameState } from '../core/GameState.js';
import { STALL_BASE_SLOTS, STALL_SLOT_UPGRADE_COST_BASE, STALL_SLOT_UPGRADE_COST_MULT, UPGRADE_COST_THRESHOLDS } from '../core/constants.js';

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

/** Cost for rank R of a tier-T upgrade: uses upgrade cost thresholds (gentler scaling for high tiers). */
function tierScaledCost(tier: number, rank: number): number {
  const idx = Math.min(tier + rank, UPGRADE_COST_THRESHOLDS.length - 1);
  return UPGRADE_COST_THRESHOLDS[idx];
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
    id: 'hagglers_dice',
    name: "Haggler's Dice",
    description: '-1 to customer roll',
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
    description: '5 fewer shuffles',
    tier: 2,
    maxRank: 4,
    icon: '📚',
    costForRank: (rank) => tierScaledCost(2, rank),
  },
  // Tier 3 (Trader's Row)
  {
    id: 'reputation_boost',
    name: 'Reputation Boost',
    description: '+1 base reputation per sale',
    tier: 3,
    maxRank: 5,
    icon: '⭐',
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
    costForRank: (rank) => [20_000, 32_000, 50_000, 75_000][rank - 1] ?? 75_000,
  },
  // Tier 5 (Guild Quarters)
  {
    id: 'supply_chain',
    name: 'Supply Chain',
    description: '-10% cooldown on bought goods',
    tier: 5,
    maxRank: 5,
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
    description: '-10% cooldown on forged items',
    tier: 6,
    maxRank: 5,
    icon: '🏭',
    costForRank: (rank) => tierScaledCost(6, rank),
  },
  // Tier 7 (Diamond District) - merchant_guild removed
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
    .filter(() => true); // Include maxed upgrades so they stay visible
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
