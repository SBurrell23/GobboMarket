import { gameState } from '../core/GameState.js';
import { MAX_COINS, TIER_NAMES } from '../core/constants.js';

export interface MilestoneDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  check: () => boolean;
}

export const MILESTONES: MilestoneDefinition[] = [
  {
    id: 'first_sale',
    name: 'First Sale',
    description: 'Sell your first item.',
    icon: '🪙',
    check: () => gameState.data.itemsSold >= 1,
  },
  {
    id: 'ten_sales',
    name: 'Merchant in Training',
    description: 'Sell 10 items.',
    icon: '📈',
    check: () => gameState.data.itemsSold >= 10,
  },
  {
    id: 'fifty_sales',
    name: 'Seasoned Merchant',
    description: 'Sell 50 items.',
    icon: '🏪',
    check: () => gameState.data.itemsSold >= 50,
  },
  {
    id: 'hundred_sales',
    name: 'Master Merchant',
    description: 'Sell 100 items.',
    icon: '🏆',
    check: () => gameState.data.itemsSold >= 100,
  },
  {
    id: 'first_craft',
    name: 'Apprentice Smith',
    description: 'Craft your first item.',
    icon: '🔨',
    check: () => gameState.data.itemsCrafted >= 1,
  },
  {
    id: 'twenty_crafts',
    name: 'Journeyman Smith',
    description: 'Craft 20 items.',
    icon: '⚒️',
    check: () => gameState.data.itemsCrafted >= 20,
  },
  {
    id: 'haggle_master',
    name: 'Silver Tongue',
    description: 'Win 25 haggle rounds.',
    icon: '🎲',
    check: () => gameState.data.haggleWins >= 25,
  },
  {
    id: 'coins_1000',
    name: 'Thousand Gold',
    description: 'Earn 1,000 gold total.',
    icon: '💰',
    check: () => gameState.data.totalEarned >= 1000,
  },
  {
    id: 'coins_10000',
    name: 'Ten Thousand Gold',
    description: 'Earn 10,000 gold total.',
    icon: '💰',
    check: () => gameState.data.totalEarned >= 10000,
  },
  {
    id: 'coins_100000',
    name: 'Hundred Thousand Gold',
    description: 'Earn 100,000 gold total.',
    icon: '💰',
    check: () => gameState.data.totalEarned >= 100000,
  },
  ...TIER_NAMES.slice(1).map((name, i) => ({
    id: `tier_${i + 1}`,
    name: `Reached ${name}`,
    description: `Advance to the ${name}.`,
    icon: '🗺️',
    check: () => gameState.currentTier >= i + 1,
  })),
  {
    id: 'max_coins',
    name: 'Goblin Tycoon',
    description: `Reach ${MAX_COINS.toLocaleString()} gold. You win!`,
    icon: '👑',
    check: () => gameState.hasMaxCoins,
  },
];

export function checkMilestones(): MilestoneDefinition[] {
  const newMilestones: MilestoneDefinition[] = [];
  for (const m of MILESTONES) {
    if (!gameState.hasMilestone(m.id) && m.check()) {
      gameState.addMilestone(m.id);
      newMilestones.push(m);
    }
  }
  return newMilestones;
}

export function getCompletedMilestones(): MilestoneDefinition[] {
  return MILESTONES.filter(m => gameState.hasMilestone(m.id));
}

export function getAllMilestones(): MilestoneDefinition[] {
  return [...MILESTONES];
}
