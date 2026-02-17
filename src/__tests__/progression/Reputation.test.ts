import { describe, it, expect, beforeEach } from 'vitest';
import { calculateReputationGain, getReputationLevel } from '../../progression/Reputation.js';
import { gameState } from '../../core/GameState.js';
import { eventBus } from '../../core/EventBus.js';
import { REPUTATION_PER_SALE_BASE, REPUTATION_QUALITY_BONUS, REPUTATION_HAGGLE_WIN_BONUS } from '../../core/constants.js';

describe('Reputation', () => {
  beforeEach(() => {
    gameState.reset();
    eventBus.clear();
  });

  it('should give base reputation for a sale', () => {
    const rep = calculateReputationGain(2, false);
    expect(rep).toBe(REPUTATION_PER_SALE_BASE);
  });

  it('should give bonus for high quality items', () => {
    const normalRep = calculateReputationGain(2, false);
    const highQualityRep = calculateReputationGain(4, false);
    expect(highQualityRep).toBeGreaterThan(normalRep);
  });

  it('should give bonus for winning haggle', () => {
    const noHaggle = calculateReputationGain(2, false);
    const withHaggle = calculateReputationGain(2, true);
    expect(withHaggle).toBe(noHaggle + REPUTATION_HAGGLE_WIN_BONUS);
  });

  it('should calculate quality bonus correctly', () => {
    const rep = calculateReputationGain(4, false);
    expect(rep).toBe(REPUTATION_PER_SALE_BASE + REPUTATION_QUALITY_BONUS * 2);
  });

  it('should return correct reputation level', () => {
    expect(getReputationLevel()).toBe('Nobody');

    gameState.addReputation(50);
    expect(getReputationLevel()).toBe('Known');

    gameState.addReputation(150);
    expect(getReputationLevel()).toBe('Respected');

    gameState.addReputation(400);
    expect(getReputationLevel()).toBe('Renowned');

    gameState.addReputation(900);
    expect(getReputationLevel()).toBe('Legendary');
  });
});
