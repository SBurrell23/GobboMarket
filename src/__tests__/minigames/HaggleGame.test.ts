import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HaggleGame } from '../../minigames/HaggleGame.js';
import type { Customer } from '../../market/Customer.js';

function makeCustomer(): Customer {
  return {
    id: 'test-cust',
    type: 'human',
    name: 'Test Human',
    icon: '🧑',
    desiredCategory: 'weapon',
    refusedCategory: 'food',
    patience: 5,
    haggleTier: 'medium',
    budgetMultiplier: 1.0,
    arrivedAt: Date.now(),
  };
}

describe('HaggleGame (Press Your Luck)', () => {
  let game: HaggleGame;

  beforeEach(() => {
    game = new HaggleGame(makeCustomer());
  });

  it('should start with zero player total', () => {
    const state = game.getState();
    expect(state.playerTotal).toBe(0);
    expect(state.playerRolls).toEqual([]);
  });

  it('should generate customer roll between 1 and 20', () => {
    // Trigger the customer roll by starting with a mock container
    const container = document.createElement('div');
    game.start(container);
    const state = game.getState();
    expect(state.customerRoll).toBeGreaterThanOrEqual(1);
    expect(state.customerRoll).toBeLessThanOrEqual(20);
  });

  it('should add d6 roll to player total (when not busting)', () => {
    const container = document.createElement('div');
    game.start(container);

    // Mock Math.random to return a non-1 value (returns 6)
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    game.doPlayerRoll();
    const state = game.getState();
    expect(state.playerRolls).toHaveLength(1);
    expect(state.playerRolls[0]).toBe(6);
    expect(state.playerTotal).toBe(6);
    vi.restoreAllMocks();
  });

  it('should bust when rolling a 1', () => {
    const container = document.createElement('div');
    game.start(container);

    // Mock Math.random to return 0 (roll = 1)
    vi.spyOn(Math, 'random').mockReturnValue(0);
    game.doPlayerRoll();
    const state = game.getState();
    expect(state.playerRolls[state.playerRolls.length - 1]).toBe(1);
    expect(state.outcome).toBe('bust');
    expect(state.phase).toBe('result');
    vi.restoreAllMocks();
  });

  it('should accumulate multiple rolls', () => {
    const container = document.createElement('div');
    game.start(container);

    // Roll a 4 then a 5
    vi.spyOn(Math, 'random')
      .mockReturnValueOnce(0.5)  // d6: floor(0.5*6)+1 = 4
      .mockReturnValueOnce(0.7); // d6: floor(0.7*6)+1 = 5
    game.doPlayerRoll();
    game.doPlayerRoll();
    const state = game.getState();
    expect(state.playerRolls).toHaveLength(2);
    expect(state.playerTotal).toBe(4 + 5);
    vi.restoreAllMocks();
  });

  it('should have phase set to player-turn after customer roll', () => {
    const container = document.createElement('div');
    game.start(container);
    expect(game.getState().phase).toBe('player-turn');
  });
});
