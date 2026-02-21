import {
  CUSTOMER_TYPES,
  CUSTOMER_ICONS,
  CUSTOMER_PATIENCE,
  CUSTOMER_TIER_UNLOCK,
  CUSTOMER_HAGGLE_TIER,
  type HaggleTier,
} from '../core/constants.js';
import type { GoodsDefinition } from './Goods.js';
import {
  GOBLIN_NAMES, HUMAN_NAMES, ELF_NAMES, DWARF_NAMES,
  ORC_NAMES, HALFLING_NAMES, NOBLE_NAMES, WIZARD_NAMES,
} from './names.js';

export interface Customer {
  id: string;
  type: typeof CUSTOMER_TYPES[number];
  name: string;
  icon: string;
  desiredCategory: GoodsDefinition['category'];
  patience: number;
  haggleTier: HaggleTier;
  budgetMultiplier: number;
  arrivedAt: number;
}

const NAME_POOLS: Record<string, string[]> = {
  goblin: GOBLIN_NAMES,
  human: HUMAN_NAMES,
  elf: ELF_NAMES,
  dwarf: DWARF_NAMES,
  orc: ORC_NAMES,
  halfling: HALFLING_NAMES,
  noble: NOBLE_NAMES,
  wizard: WIZARD_NAMES,
};

const CATEGORY_PREFERENCES: Record<string, GoodsDefinition['category'][]> = {
  goblin: ['weapon', 'food', 'trinket', 'potion'],
  human: ['weapon', 'armor', 'food', 'potion'],
  elf: ['potion', 'trinket', 'weapon'],
  dwarf: ['armor', 'weapon', 'food'],
  orc: ['weapon', 'food', 'armor'],
  halfling: ['food', 'potion', 'trinket'],
  noble: ['trinket', 'armor', 'potion'],
  wizard: ['potion', 'weapon', 'food'],
};

let nextId = 0;

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function createCustomer(type: typeof CUSTOMER_TYPES[number]): Customer {
  const names = NAME_POOLS[type] ?? HUMAN_NAMES;
  const prefs = CATEGORY_PREFERENCES[type] ?? ['weapon'];
  const haggleTier = CUSTOMER_HAGGLE_TIER[type] ?? 'medium';
  const desired = pickRandom(prefs);
  return {
    id: `customer-${nextId++}`,
    type,
    name: pickRandom(names),
    icon: CUSTOMER_ICONS[type] ?? '🧑',
    desiredCategory: desired,
    patience: CUSTOMER_PATIENCE[type] ?? 5,
    haggleTier,
    budgetMultiplier: type === 'noble' ? 1.5 : type === 'wizard' ? 1.3 : type === 'elf' ? 1.2 : type === 'goblin' ? 0.8 : type === 'orc' ? 0.9 : 1.0,
    arrivedAt: Date.now(),
  };
}

export function getAvailableCustomerTypes(tier: number): typeof CUSTOMER_TYPES[number][] {
  return CUSTOMER_TYPES.filter(t => (CUSTOMER_TIER_UNLOCK[t] ?? 0) <= tier);
}

export function resetCustomerIds(): void {
  nextId = 0;
}
