import { describe, it, expect, beforeEach } from 'vitest';
import { AppraisalGame } from '../../minigames/AppraisalGame.js';

describe('AppraisalGame (Memory Match)', () => {
  let game: AppraisalGame;

  beforeEach(() => {
    game = new AppraisalGame(0);
  });

  it('should generate correct number of card pairs for tier 0', () => {
    game.generateCards();
    const state = game.getState();
    expect(state.totalPairs).toBe(4);
    expect(state.cards).toHaveLength(8);
  });

  it('should generate more pairs at higher tiers', () => {
    const game2 = new AppraisalGame(2);
    game2.generateCards();
    expect(game2.getState().totalPairs).toBe(6);
  });

  it('should have all cards face down initially', () => {
    game.generateCards();
    const state = game.getState();
    expect(state.cards.every(c => !c.flipped && !c.matched)).toBe(true);
  });

  it('should have exactly 2 cards per pair', () => {
    game.generateCards();
    const state = game.getState();
    const pairCounts = new Map<number, number>();
    for (const card of state.cards) {
      pairCounts.set(card.pairId, (pairCounts.get(card.pairId) ?? 0) + 1);
    }
    for (const count of pairCounts.values()) {
      expect(count).toBe(2);
    }
  });

  it('should flip a card when handleFlip is called', () => {
    game.generateCards();
    game.handleFlip(0);
    const state = game.getState();
    expect(state.cards[0].flipped).toBe(true);
  });

  it('should start with 0 matches and mismatches', () => {
    game.generateCards();
    const state = game.getState();
    expect(state.matchedPairs).toBe(0);
    expect(state.mismatches).toBe(0);
  });
});
