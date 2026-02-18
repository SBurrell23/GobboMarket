import { gameState } from '../core/GameState.js';
import { STALL_SLOT_UPGRADE_COST_BASE, STALL_SLOT_UPGRADE_COST_MULT } from '../core/constants.js';

export interface UpgradeDefinition {
  id: string;
  name: string;
  description: string;
  cost: number;
  tier: number;
  effect: () => void;
  icon: string;
}

function stallSlotCost(): number {
  const currentSlots = gameState.stallSlots;
  const extraSlots = currentSlots - 4;
  return Math.round(STALL_SLOT_UPGRADE_COST_BASE * Math.pow(STALL_SLOT_UPGRADE_COST_MULT, extraSlots));
}

export const UPGRADES: UpgradeDefinition[] = [
  // Tier 0 upgrades
  {
    id: 'stall_slot_1',
    name: 'Wider Stall',
    description: 'Add one more display slot to your stall.',
    get cost() { return stallSlotCost(); },
    tier: 0,
    effect: () => gameState.incrementStallSlots(),
    icon: '🏗️',
  },
  {
    id: 'market_sign',
    name: 'Market Sign',
    description: 'Customers arrive 15% faster.',
    cost: 40,
    tier: 0,
    effect: () => gameState.addUpgrade('market_sign'),
    icon: '🪧',
  },
  {
    id: 'sturdy_workbench',
    name: 'Sturdy Workbench',
    description: '+10% base sell price on all crafted items.',
    cost: 50,
    tier: 0,
    effect: () => gameState.addUpgrade('sturdy_workbench'),
    icon: '🪑',
  },
  {
    id: 'thick_gloves',
    name: 'Thick Gloves',
    description: 'Wider sweet spot in the forge minigame.',
    cost: 60,
    tier: 0,
    effect: () => gameState.addUpgrade('thick_gloves'),
    icon: '🧤',
  },
  {
    id: 'hagglers_dice',
    name: "Haggler's Dice",
    description: 'Customer d20 roll is reduced by 2 when haggling.',
    cost: 175,
    tier: 1,
    effect: () => gameState.addUpgrade('hagglers_dice'),
    icon: '🎲',
  },
  {
    id: 'keen_eye',
    name: 'Keen Eye',
    description: '+5 seconds on all timed minigames.',
    cost: 200,
    tier: 1,
    effect: () => gameState.addUpgrade('keen_eye'),
    icon: '👁️',
  },
  {
    id: 'quick_hands',
    name: 'Quick Hands',
    description: '-25% cooldown on Tier 1-2 items.',
    cost: 90,
    tier: 0,
    effect: () => gameState.addUpgrade('quick_hands'),
    icon: '🤲',
  },
  // Tier 1 upgrades
  {
    id: 'forge_bellows',
    name: 'Forge Bellows',
    description: 'Slows the forge meter slightly for easier strikes.',
    cost: 150,
    tier: 1,
    effect: () => gameState.addUpgrade('forge_bellows'),
    icon: '🔥',
  },
  {
    id: 'silver_tongue',
    name: 'Silver Tongue',
    description: 'Customer d20 roll is reduced by another 3.',
    cost: 600,
    tier: 2,
    effect: () => gameState.addUpgrade('silver_tongue'),
    icon: '👅',
  },
  {
    id: 'jewelers_loupe',
    name: "Jeweler's Loupe",
    description: '+5 more seconds on timed minigames.',
    cost: 500,
    tier: 2,
    effect: () => gameState.addUpgrade('jewelers_loupe'),
    icon: '🔍',
  },
  {
    id: 'rune_library',
    name: 'Rune Library',
    description: 'Fewer shuffles in the sliding puzzle.',
    cost: 250,
    tier: 1,
    effect: () => gameState.addUpgrade('rune_library'),
    icon: '📚',
  },
  // Tier 2 upgrades
  {
    id: 'efficient_workshop',
    name: 'Efficient Workshop',
    description: '-20% cooldown on all forged items.',
    cost: 800,
    tier: 2,
    effect: () => gameState.addUpgrade('efficient_workshop'),
    icon: '🏭',
  },
  {
    id: 'merchant_guild',
    name: 'Merchant Guild Card',
    description: 'Reduces material costs by 10%.',
    cost: 1000,
    tier: 2,
    effect: () => gameState.addUpgrade('merchant_guild'),
    icon: '📜',
  },
  // Tier 3 upgrades
  {
    id: 'supply_chain',
    name: 'Supply Chain',
    description: '-20% cooldown on all bought goods.',
    cost: 2000,
    tier: 3,
    effect: () => gameState.addUpgrade('supply_chain'),
    icon: '📦',
  },
  {
    id: 'enchant_table',
    name: 'Enchanting Table',
    description: 'Increases enchantment multiplier bonus by 20%.',
    cost: 2500,
    tier: 3,
    effect: () => gameState.addUpgrade('enchant_table'),
    icon: '✨',
  },
  // Tier 4 upgrades
  {
    id: 'master_forge',
    name: 'Master Forge',
    description: 'Wider sweet spot in forge minigame.',
    cost: 6000,
    tier: 4,
    effect: () => gameState.addUpgrade('master_forge'),
    icon: '⚒️',
  },
  {
    id: 'bargain_specialist',
    name: 'Bargain Specialist',
    description: '+30% sell price on Tier 1-3 items.',
    cost: 4000,
    tier: 4,
    effect: () => gameState.addUpgrade('bargain_specialist'),
    icon: '🏷️',
  },
  // Tier 5 upgrades
  {
    id: 'master_supplier',
    name: 'Master Supplier',
    description: '-25% cooldown on all items.',
    cost: 18000,
    tier: 5,
    effect: () => gameState.addUpgrade('master_supplier'),
    icon: '🚀',
  },
  {
    id: 'royal_charter',
    name: 'Royal Charter',
    description: 'Nobles visit more frequently and pay 20% more.',
    cost: 15000,
    tier: 5,
    effect: () => gameState.addUpgrade('royal_charter'),
    icon: '📋',
  },
  {
    id: 'master_appraiser',
    name: 'Master Appraiser',
    description: 'Memory match starts with 2 fewer pairs.',
    cost: 12000,
    tier: 5,
    effect: () => gameState.addUpgrade('master_appraiser'),
    icon: '🧐',
  },
  // Tier 6 upgrades
  {
    id: 'vintage_trader',
    name: 'Vintage Trader',
    description: '+40% sell price on Tier 1-4 items.',
    cost: 40000,
    tier: 6,
    effect: () => gameState.addUpgrade('vintage_trader'),
    icon: '🏺',
  },
  {
    id: 'grand_emporium',
    name: 'Grand Emporium',
    description: 'All goods sell for 15% more.',
    cost: 50000,
    tier: 6,
    effect: () => gameState.addUpgrade('grand_emporium'),
    icon: '🏛️',
  },
  {
    id: 'golden_scales',
    name: 'Golden Scales',
    description: 'Customers pay 10% more for all goods.',
    cost: 60000,
    tier: 6,
    effect: () => gameState.addUpgrade('golden_scales'),
    icon: '⚖️',
  },
  // Tier 7 upgrades
  {
    id: 'arcane_anvil',
    name: 'Arcane Anvil',
    description: 'Forged items have a chance of starting enchanted.',
    cost: 200000,
    tier: 7,
    effect: () => gameState.addUpgrade('arcane_anvil'),
    icon: '🔮',
  },
  // Tier 8 upgrades
  {
    id: 'relic_connoisseur',
    name: 'Relic Connoisseur',
    description: '+50% sell price on Tier 1-6 items.',
    cost: 350000,
    tier: 8,
    effect: () => gameState.addUpgrade('relic_connoisseur'),
    icon: '🗝️',
  },
  {
    id: 'merchant_legend',
    name: 'Merchant Legend',
    description: 'All sale prices doubled. The ultimate upgrade.',
    cost: 400000,
    tier: 8,
    effect: () => gameState.addUpgrade('merchant_legend'),
    icon: '🌟',
  },
];

export function getAvailableUpgrades(): UpgradeDefinition[] {
  return UPGRADES.filter(u => {
    if (u.id === 'stall_slot_1') return true;
    return u.tier <= gameState.currentTier && !gameState.hasUpgrade(u.id);
  });
}

export function purchaseUpgrade(upgradeId: string): boolean {
  const upgrade = UPGRADES.find(u => u.id === upgradeId);
  if (!upgrade) return false;
  if (upgradeId !== 'stall_slot_1' && gameState.hasUpgrade(upgradeId)) return false;
  if (!gameState.spendCoins(upgrade.cost, upgrade.name)) return false;

  upgrade.effect();
  return true;
}
