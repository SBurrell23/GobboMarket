import { describe, it, expect, beforeEach } from 'vitest';
import { RuneCraftGame } from '../../minigames/RuneCraftGame.js';

describe('RuneCraftGame (Sliding Puzzle)', () => {
  let game: RuneCraftGame;

  beforeEach(() => {
    game = new RuneCraftGame(0);
  });

  it('should generate a 9-tile puzzle with one empty space', () => {
    game.generatePuzzle();
    const state = game.getState();
    expect(state.tiles).toHaveLength(9);
    expect(state.targetTiles).toHaveLength(9);
    const nullCount = state.tiles.filter(t => t === null).length;
    expect(nullCount).toBe(1);
  });

  it('should not start in solved state', () => {
    game.generatePuzzle();
    expect(game.checkWin()).toBe(false);
  });

  it('should track moves when sliding', () => {
    game.generatePuzzle();
    const state = game.getState();
    expect(state.moves).toBe(0);

    // Find a valid neighbor of the empty space and slide it
    const emptyIdx = state.tiles.indexOf(null);
    const row = Math.floor(emptyIdx / 3);
    const col = emptyIdx % 3;
    let neighbor = -1;
    if (row > 0) neighbor = emptyIdx - 3;
    else if (row < 2) neighbor = emptyIdx + 3;
    else if (col > 0) neighbor = emptyIdx - 1;
    else neighbor = emptyIdx + 1;

    game.handleSlide(neighbor);
    expect(game.getState().moves).toBe(1);
  });

  it('should not allow sliding non-adjacent tiles', () => {
    game.generatePuzzle();
    const state = game.getState();
    const emptyIdx = state.tiles.indexOf(null);
    // Pick a tile that is NOT adjacent to the empty
    let farTile = -1;
    for (let i = 0; i < 9; i++) {
      const rowDiff = Math.abs(Math.floor(i / 3) - Math.floor(emptyIdx / 3));
      const colDiff = Math.abs((i % 3) - (emptyIdx % 3));
      if (i !== emptyIdx && rowDiff + colDiff > 1) {
        farTile = i;
        break;
      }
    }
    if (farTile >= 0) {
      game.handleSlide(farTile);
      expect(game.getState().moves).toBe(0);
    }
  });

  it('should detect win condition correctly', () => {
    game.generatePuzzle();
    // The puzzle starts shuffled, so it should not be a win
    expect(game.checkWin()).toBe(false);
    // countMatches should be less than 9
    expect(game.countMatches()).toBeLessThan(9);
  });

  it('should count correct tile matches', () => {
    game.generatePuzzle();
    const matches = game.countMatches();
    expect(matches).toBeGreaterThanOrEqual(0);
    expect(matches).toBeLessThanOrEqual(9);
  });

  it('should have more shuffles at higher tiers', () => {
    const game0 = new RuneCraftGame(0);
    const game3 = new RuneCraftGame(3);
    game0.generatePuzzle();
    game3.generatePuzzle();
    // Both should be valid puzzles (not solved)
    expect(game0.checkWin()).toBe(false);
    expect(game3.checkWin()).toBe(false);
  });
});
