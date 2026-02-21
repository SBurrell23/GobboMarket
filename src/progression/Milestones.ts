import { gameState } from '../core/GameState.js';
import { MAX_COINS, MUSIC_TRACK_NAMES, TIER_NAMES } from '../core/constants.js';
import { RECIPES } from './Recipes.js';

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
  {
    id: 'masterwork_collector',
    name: 'Masterwork Collector',
    description: 'Craft or buy 23 masterwork items.',
    icon: '✨',
    check: () => (gameState.data.craftsByQuality?.[4] ?? 0) >= 23,
  },
  {
    id: 'spacious_stall',
    name: 'Spacious Stall',
    description: 'Reach 15 stall slots.',
    icon: '🏪',
    check: () => gameState.stallSlots >= 15,
  },
  {
    id: 'unlucky_underdog',
    name: 'Unlucky!',
    description: 'Lose a haggle when the customer rolled 3 or less.',
    icon: '😅',
    check: () => gameState.data.lostHaggleWithCustomerRoll3OrLess === true,
  },
  {
    id: 'strong_fingers',
    name: 'Strong Fingers',
    description: 'Buy an item with a reaction time of 175ms or less.',
    icon: '⚡',
    check: () => gameState.data.boughtWithReaction175OrLess === true,
  },
  {
    id: 'elven_steel',
    name: 'Elven Steel',
    description: 'Forge an item with a combined score of 198 or higher.',
    icon: '⚔️',
    check: () => gameState.data.forgedElvenSteel === true,
  },
  {
    id: 'rune_master',
    name: 'Rune Master',
    description: 'Perfect an enchant (9/9).',
    icon: '🔮',
    check: () => gameState.data.enchantedPerfectly === true,
  },
  {
    id: 'lucky_bust',
    name: 'That Stings!',
    description: 'Lose a haggle with a price multiplier of 0.65.',
    icon: '🎲',
    check: () => gameState.data.lostHaggleWithMultiplier065OrLess === true,
  },
  {
    id: 'legendary_deal',
    name: 'Well Known',
    description: 'Sell a masterwork, perfectly enchanted, desired item and win the haggle.',
    icon: '👑',
    check: () => gameState.data.perfectReputationSell === true,
  },
  {
    id: 'lightning_reflexes',
    name: 'Slow Hands',
    description: "Max out the Auctioneer's Reflex upgrade.",
    icon: '⚡',
    check: () => gameState.getUpgradeRank('auctioneers_reflex') >= 4,
  },
  {
    id: 'infinity_to_wizard',
    name: "He Doesn't Want That",
    description: 'Sell an Infinity Gem to a wizard.',
    icon: '💠',
    check: () => gameState.data.soldInfinityGemToWizard === true,
  },
  {
    id: 'waybread_merchant',
    name: 'Lembas',
    description: 'Sell 4 Elven Waybread to halflings.',
    icon: '🍞',
    check: () => (gameState.data.waybreadSoldToHalfling ?? 0) >= 4,
  },
  {
    id: 'garbage_heap',
    name: 'Garbage Heap',
    description: 'Obtain 50 shoddy items.',
    icon: '🗑️',
    check: () => (gameState.data.craftsByQuality?.[0] ?? 0) >= 50,
  },
  {
    id: 'all_recipes',
    name: 'Recipe Collector',
    description: 'Buy all recipes in the game.',
    icon: '📜',
    check: () => RECIPES.every(r => gameState.hasRecipe(r.id)),
  },
  {
    id: 'music_lover',
    name: 'Audiophile',
    description: 'Listen to every song.',
    icon: '🎵',
    check: () => MUSIC_TRACK_NAMES.every(name => (gameState.data.songsHeard ?? []).includes(name)),
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
