export const MAX_COINS = 1_000_000;

export const SAVE_KEY = 'gobbo-market-save';
export const SAVE_VERSION = 3;

export const TIER_NAMES = [
  'Muddy Alley',
  'Back Alley Bazaar',
  'Market Square',
  "Trader's Row",
  'Merchant Quarter',
  'Guild Quarters',
  'Royal Bazaar',
  'Diamond District',
  'Grand Exchange',
] as const;

/** Music track filenames (must match tracks.json). Used for "heard every song" milestone. */
export const MUSIC_TRACK_NAMES = [
  'Gold Coins.mp3',
  'Jaunty Times.mp3',
  'A Goblins Journey.mp3',
  'Slow Days.mp3',
  'Market Memories.mp3',
  'Art of the Craft.mp3',
] as const;

/** Background image filename per tier (in public/assets/images). Uses muddy-alley as fallback. */
export const TIER_BACKGROUND_IMAGES: Record<number, string> = {
  0: 'muddy-alley.png',
  1: 'back-alley-bazaar.png',
  2: 'market-square.png',
  3: 'traders-row.png',
  4: 'merchant-quarter.png',
  5: 'guild-quarters.png',
  6: 'royal-bazaar.png',
  7: 'diamond-district.png',
  8: 'grand-exchange.png',
};

export const TIER_THRESHOLDS = [0, 150, 500, 2_500, 5_000, 15_000, 50_000, 200_000, 500_000] as const;

/** Upgrade cost per (tier + rank) index. Gentler scaling for high tiers: T5 starts 15k, T6 starts 20k. */
export const UPGRADE_COST_THRESHOLDS = [
  0, 150, 500, 1_500, 5_000, 15_000, 15_000, 20_000, 28_000, 36_000, 45_000, 55_000, 65_000, 75_000,
] as const;

/** Max customers browsing concurrently per tier. */
export const TIER_MAX_CUSTOMERS = [5, 6, 7, 8, 10, 10, 12, 13, 15] as const;

export const TIER_RACE_REPUTATION_REQUIRED: Record<string, number>[] = [
  {},                                                                                 // T0: Muddy Alley
  { goblin: 40, human: 40 },                                                         // T1: Back Alley Bazaar
  { goblin: 75, human: 75, elf: 40 },                                                // T2: Market Square
  { goblin: 150, human: 150, elf: 105, dwarf: 55 },                                  // T3: Trader's Row
  { goblin: 210, human: 210, elf: 160, dwarf: 105, orc: 55 },                        // T4: Merchant Quarter
  { goblin: 315, human: 315, elf: 210, dwarf: 160, orc: 105, halfling: 55 },         // T5: Guild Quarters
  { goblin: 420, human: 420, elf: 315, dwarf: 265, orc: 160, halfling: 105 },         // T6: Royal Bazaar
  { goblin: 525, human: 525, elf: 420, dwarf: 370, orc: 265, halfling: 210, noble: 105 },         // T7: Diamond District
  { goblin: 630, human: 630, elf: 525, dwarf: 475, orc: 370, halfling: 315, noble: 210, wizard: 105 }, // T8: Grand Exchange
];

export const QUALITY_LABELS = ['Shoddy', 'Passable', 'Fine', 'Superior', 'Masterwork'] as const;
export const QUALITY_MULTIPLIERS = [0.6, 1.0, 1.2, 1.5, 1.8] as const;

export const CUSTOMER_TYPES = [
  'goblin', 'human', 'elf', 'dwarf', 'orc', 'halfling', 'noble', 'wizard',
] as const;

export const CUSTOMER_ICONS: Record<string, string> = {
  goblin: '👺',
  human: '🧑',
  elf: '🧝',
  dwarf: '⛏️',
  orc: '👹',
  halfling: '🍀',
  noble: '👑',
  wizard: '🧙',
};

export const CUSTOMER_PATIENCE: Record<string, number> = {
  goblin: 3,
  human: 5,
  elf: 7,
  dwarf: 4,
  orc: 2,
  halfling: 6,
  noble: 3,
  wizard: 4,
};

export type HaggleTier = 'poor' | 'medium' | 'tough';

export const CUSTOMER_HAGGLE_TIER: Record<string, HaggleTier> = {
  goblin: 'tough',
  human: 'poor',
  elf: 'tough',
  dwarf: 'medium',
  orc: 'poor',
  halfling: 'medium',
  noble: 'tough',
  wizard: 'medium',
};

export const CUSTOMER_TIER_UNLOCK: Record<string, number> = {
  goblin: 0,
  human: 0,
  elf: 1,
  dwarf: 2,
  orc: 3,
  halfling: 4,
  noble: 6,
  wizard: 7,
};

export const FORGE_STRIKES = 2;
export const FORGE_BASE_WINDOW = 0.18;
export const FORGE_TIER_TIGHTENING = 0.03;

export const HAGGLE_ROUNDS = 3;
export const HAGGLE_WIN_MULTIPLIER_MIN = 1.2;
export const HAGGLE_WIN_MULTIPLIER_MAX = 1.8;
export const HAGGLE_LOSE_MULTIPLIER_MIN = 0.6;
export const HAGGLE_LOSE_MULTIPLIER_MAX = 0.9;

export const RUNECRAFT_BASE_GRID = 3;
export const RUNECRAFT_ENCHANT_MULTIPLIER = 3.0;

export const STALL_BASE_SLOTS = 5;
export const STALL_SLOT_UPGRADE_COST_BASE = 100;
export const STALL_SLOT_UPGRADE_COST_MULT = 2;

export const REPUTATION_PER_SALE_BASE = 5;
export const REPUTATION_DESIRED_BONUS = 3;
/** Reputation bonus by quality: Shoddy 0, Passable 0, Fine 3, Superior 5, Masterwork 10 */
export const REPUTATION_QUALITY_BONUSES = [0, 0, 3, 5, 10] as const;
export const REPUTATION_HAGGLE_WIN_BONUS = 5;
export const REPUTATION_HAGGLE_SETTLE_BONUS = 1;
export const REPUTATION_HAGGLE_BUST_PENALTY = 1;
