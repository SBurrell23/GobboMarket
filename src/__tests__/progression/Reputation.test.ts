import { describe, it, expect, beforeEach } from 'vitest';
import { calculateReputationGain, getReputationLevel } from '../../progression/Reputation.js';
import { gameState } from '../../core/GameState.js';
import { eventBus } from '../../core/EventBus.js';
import { REPUTATION_PER_SALE_BASE, REPUTATION_QUALITY_BONUSES, REPUTATION_HAGGLE_WIN_BONUS, REPUTATION_HAGGLE_SETTLE_BONUS, REPUTATION_HAGGLE_BUST_PENALTY } from '../../core/constants.js';

describe('Reputation', () => {
  beforeEach(() => {
    gameState.reset();
    eventBus.clear();
  });

  it('should give base reputation for a sale with bust', () => {
    const rep = calculateReputationGain(1, 'bust'); // Passable = no quality bonus
    expect(rep).toBe(REPUTATION_PER_SALE_BASE - REPUTATION_HAGGLE_BUST_PENALTY);
  });

  it('should give base + settle bonus for settling', () => {
    const rep = calculateReputationGain(1, 'settle'); // Passable = no quality bonus
    expect(rep).toBe(REPUTATION_PER_SALE_BASE + REPUTATION_HAGGLE_SETTLE_BONUS);
  });

  it('should give bonus for high quality items', () => {
    const normalRep = calculateReputationGain(1, 'settle');
    const highQualityRep = calculateReputationGain(4, 'settle');
    expect(highQualityRep).toBeGreaterThan(normalRep);
  });

  it('should give bonus for winning haggle', () => {
    const settleRep = calculateReputationGain(1, 'settle');
    const winRep = calculateReputationGain(1, 'win');
    expect(winRep).toBe(settleRep - REPUTATION_HAGGLE_SETTLE_BONUS + REPUTATION_HAGGLE_WIN_BONUS);
  });

  it('should calculate quality bonus correctly', () => {
    const rep = calculateReputationGain(4, 'settle');
    expect(rep).toBe(REPUTATION_PER_SALE_BASE + REPUTATION_QUALITY_BONUSES[4] + REPUTATION_HAGGLE_SETTLE_BONUS);
  });

  it('should apply bust penalty', () => {
    const rep = calculateReputationGain(1, 'bust'); // Passable = no quality bonus
    expect(rep).toBe(REPUTATION_PER_SALE_BASE - REPUTATION_HAGGLE_BUST_PENALTY);
  });

  it('should return correct reputation level', () => {
    expect(getReputationLevel()).toBe('Nobody');

    gameState.addRaceReputation('goblin', 50);
    expect(getReputationLevel()).toBe('Known');

    gameState.addRaceReputation('human', 150);
    expect(getReputationLevel()).toBe('Respected');

    gameState.addRaceReputation('elf', 400);
    expect(getReputationLevel()).toBe('Renowned');

    gameState.addRaceReputation('dwarf', 900);
    expect(getReputationLevel()).toBe('Legendary');
  });
});
