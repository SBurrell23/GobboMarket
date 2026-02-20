import { gameState } from '../core/GameState.js';
import {
  REPUTATION_PER_SALE_BASE,
  REPUTATION_QUALITY_BONUSES,
  REPUTATION_HAGGLE_WIN_BONUS,
  REPUTATION_HAGGLE_SETTLE_BONUS,
  REPUTATION_HAGGLE_BUST_PENALTY,
} from '../core/constants.js';

export type HaggleOutcome = 'win' | 'settle' | 'bust';

export function calculateReputationGain(quality: number, haggleOutcome: HaggleOutcome): number {
  let rep = REPUTATION_PER_SALE_BASE;
  rep += REPUTATION_QUALITY_BONUSES[quality] ?? 0;
  if (haggleOutcome === 'win') rep += REPUTATION_HAGGLE_WIN_BONUS;
  else if (haggleOutcome === 'settle') rep += REPUTATION_HAGGLE_SETTLE_BONUS;
  else if (haggleOutcome === 'bust') rep -= REPUTATION_HAGGLE_BUST_PENALTY;
  return rep;
}

export function awardReputation(quality: number, haggleOutcome: HaggleOutcome, customerRace: string): number {
  const rep = calculateReputationGain(quality, haggleOutcome);
  gameState.addRaceReputation(customerRace, rep);
  return rep;
}

export function getReputationLevel(): string {
  const rep = gameState.reputation;
  if (rep >= 1500) return 'Legendary';
  if (rep >= 600) return 'Renowned';
  if (rep >= 200) return 'Respected';
  if (rep >= 50) return 'Known';
  if (rep >= 10) return 'Newcomer';
  return 'Nobody';
}
