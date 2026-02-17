import { TIER_NAMES, TIER_THRESHOLDS, TIER_REPUTATION_REQUIRED } from '../core/constants.js';

export interface TierInfo {
  tier: number;
  name: string;
  coinThreshold: number;
  reputationRequired: number;
  description: string;
}

const TIER_DESCRIPTIONS = [
  'A muddy back alley where goblins peddle scraps. Everyone starts somewhere.',
  'The bustling town square. More customers, better goods, sharper competition.',
  'Where serious merchants do business. Exotic goods and discerning buyers.',
  'The gleaming marketplace of royalty. Only the finest wares will do.',
  'The legendary Grand Exchange. Masters of commerce converge here.',
];

export function getTierInfo(tier: number): TierInfo {
  return {
    tier,
    name: TIER_NAMES[tier] ?? 'Unknown',
    coinThreshold: TIER_THRESHOLDS[tier] ?? 0,
    reputationRequired: TIER_REPUTATION_REQUIRED[tier] ?? 0,
    description: TIER_DESCRIPTIONS[tier] ?? '',
  };
}

export function getAllTiers(): TierInfo[] {
  return TIER_NAMES.map((_, i) => getTierInfo(i));
}

export function canUnlockTier(tier: number, coins: number, reputation: number): boolean {
  if (tier < 0 || tier >= TIER_NAMES.length) return false;
  return coins >= TIER_THRESHOLDS[tier] && reputation >= TIER_REPUTATION_REQUIRED[tier];
}
