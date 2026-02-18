export const MAX_COINS = 1_000_000;

export const SAVE_KEY = 'gobbo-market-save';
export const SAVE_VERSION = 1;

export const TIER_NAMES = [
  'Muddy Alley',
  'Back Alley Bazaar',
  'Market Square',
  "Trader's Row",
  'Merchant Quarter',
  'Guild District',
  'Royal Bazaar',
  'Diamond Exchange',
  'Grand Exchange',
] as const;

export const TIER_THRESHOLDS = [0, 150, 500, 1_500, 5_000, 15_000, 50_000, 200_000, 500_000] as const;
export const TIER_REPUTATION_REQUIRED = [0, 15, 50, 120, 300, 600, 1_200, 2_500, 5_000] as const;

export const QUALITY_LABELS = ['Shoddy', 'Passable', 'Fine', 'Superior', 'Masterwork'] as const;
export const QUALITY_MULTIPLIERS = [0.6, 0.85, 1.0, 1.3, 1.8] as const;

export const CUSTOMER_TYPES = [
  'goblin', 'human', 'elf', 'dwarf', 'orc', 'halfling', 'noble', 'wizard',
] as const;

export const CUSTOMER_ICONS: Record<string, string> = {
  goblin: '👺',
  human: '🧑',
  elf: '🧝',
  dwarf: '⛏️',
  orc: '👹',
  halfling: '🧒',
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

export const CUSTOMER_HAGGLE_SKILL: Record<string, number> = {
  goblin: 0.7,
  human: 0.5,
  elf: 0.8,
  dwarf: 0.6,
  orc: 0.3,
  halfling: 0.4,
  noble: 0.5,
  wizard: 0.9,
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
export const FORGE_BASE_WINDOW = 0.25;
export const FORGE_TIER_TIGHTENING = 0.03;

export const HAGGLE_ROUNDS = 3;
export const HAGGLE_WIN_MULTIPLIER_MIN = 1.2;
export const HAGGLE_WIN_MULTIPLIER_MAX = 1.8;
export const HAGGLE_LOSE_MULTIPLIER_MIN = 0.6;
export const HAGGLE_LOSE_MULTIPLIER_MAX = 0.9;

export const APPRAISAL_BASE_ITEMS = 4;
export const APPRAISAL_TIME_SECONDS = 15;
export const APPRAISAL_TIER_EXTRA_ITEMS = 1;

export const RUNECRAFT_BASE_GRID = 3;
export const RUNECRAFT_TIME_SECONDS = 30;
export const RUNECRAFT_ENCHANT_MULTIPLIER = 3.0;

export const STALL_BASE_SLOTS = 4;
export const STALL_SLOT_UPGRADE_COST_BASE = 100;
export const STALL_SLOT_UPGRADE_COST_MULT = 2.5;

export const REPUTATION_PER_SALE_BASE = 8;
export const REPUTATION_QUALITY_BONUS = 4;
export const REPUTATION_HAGGLE_WIN_BONUS = 5;
