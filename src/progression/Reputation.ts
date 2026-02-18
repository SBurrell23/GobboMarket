import { gameState } from '../core/GameState.js';
import {
  REPUTATION_PER_SALE_BASE,
  REPUTATION_QUALITY_BONUS,
  REPUTATION_HAGGLE_WIN_BONUS,
} from '../core/constants.js';

export function calculateReputationGain(quality: number, haggleWon: boolean): number {
  let rep = REPUTATION_PER_SALE_BASE;
  if (quality >= 3) rep += REPUTATION_QUALITY_BONUS * (quality - 2);
  if (haggleWon) rep += REPUTATION_HAGGLE_WIN_BONUS;
  return rep;
}

export function awardReputation(quality: number, haggleWon: boolean, customerRace: string): number {
  const rep = calculateReputationGain(quality, haggleWon);
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
