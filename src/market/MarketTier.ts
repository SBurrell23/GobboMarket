import { TIER_NAMES, TIER_THRESHOLDS, TIER_RACE_REPUTATION_REQUIRED } from '../core/constants.js';

export interface TierInfo {
  tier: number;
  name: string;
  coinThreshold: number;
  raceReputationRequired: Record<string, number>;
  description: string;
}

const TIER_DESCRIPTIONS = [
  'A muddy back alley where goblins peddle scraps. Everyone starts somewhere.',
  'A shadowy bazaar behind the tavern. Slightly better clientele.',
  'The bustling town square. More customers, better goods, sharper competition.',
  'A proper row of trader stalls. Regulars and repeat customers appear.',
  'Where serious merchants do business. Exotic goods and discerning buyers.',
  'The guild-controlled district. Licensed traders only, premium prices.',
  'The gleaming marketplace of royalty. Only the finest wares will do.',
  'Where diamond merchants and archmages barter. Legendary goods change hands.',
  'The legendary Grand Exchange. Masters of commerce converge here.',
];

export function getTierInfo(tier: number): TierInfo {
  return {
    tier,
    name: TIER_NAMES[tier] ?? 'Unknown',
    coinThreshold: TIER_THRESHOLDS[tier] ?? 0,
    raceReputationRequired: TIER_RACE_REPUTATION_REQUIRED[tier] ?? {},
    description: TIER_DESCRIPTIONS[tier] ?? '',
  };
}

export function getAllTiers(): TierInfo[] {
  return TIER_NAMES.map((_, i) => getTierInfo(i));
}
