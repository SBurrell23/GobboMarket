import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ForgeGame } from '../../minigames/ForgeGame.js';
import { FORGE_STRIKES } from '../../core/constants.js';

describe('ForgeGame', () => {
  let game: ForgeGame;

  beforeEach(() => {
    game = new ForgeGame(0);
    document.body.innerHTML = '<div id="container"></div>';
  });

  it('should initialize with correct state', () => {
    const container = document.getElementById('container')!;
    game.start(container);
    const state = game.getState();
    expect(state.strikes).toHaveLength(0);
    expect(state.currentStrike).toBe(0);
    expect(state.running).toBe(true);
    expect(state.sweetSpotWidth).toBeGreaterThan(0);
    game.destroy();
  });

  it('should have tighter sweet spot at higher tiers', () => {
    const tier0 = new ForgeGame(0);
    const tier4 = new ForgeGame(4);
    document.body.innerHTML = '<div id="c1"></div><div id="c2"></div>';
    tier0.start(document.getElementById('c1')!);
    tier4.start(document.getElementById('c2')!);
    expect(tier4.getState().sweetSpotWidth).toBeLessThan(tier0.getState().sweetSpotWidth);
    tier0.destroy();
    tier4.destroy();
  });

  it('should record strikes when triggered', () => {
    const container = document.getElementById('container')!;
    game.start(container);

    game.setMeterPosition(game.getState().sweetSpotCenter);
    game.triggerStrike();

    const state = game.getState();
    expect(state.strikes).toHaveLength(1);
    expect(state.strikes[0]).toBeGreaterThan(0);
    game.destroy();
  });

  it('should give high accuracy when meter is at sweet spot center', () => {
    const container = document.getElementById('container')!;
    game.start(container);

    const center = game.getState().sweetSpotCenter;
    game.setMeterPosition(center);
    game.triggerStrike();

    expect(game.getState().strikes[0]).toBeCloseTo(1, 1);
    game.destroy();
  });

  it('should give low accuracy when meter is far from sweet spot', () => {
    const container = document.getElementById('container')!;
    game.start(container);

    const center = game.getState().sweetSpotCenter;
    const width = game.getState().sweetSpotWidth;
    game.setMeterPosition(center + width);
    game.triggerStrike();

    expect(game.getState().strikes[0]).toBe(0);
    game.destroy();
  });

  it('should complete after all strikes and call onComplete', async () => {
    vi.useFakeTimers();
    const container = document.getElementById('container')!;
    const completeCb = vi.fn();
    game.onComplete = completeCb;
    game.start(container);

    for (let i = 0; i < FORGE_STRIKES; i++) {
      game.setMeterPosition(game.getState().sweetSpotCenter);
      game.triggerStrike();
      if (i < FORGE_STRIKES - 1) {
        vi.advanceTimersByTime(600);
      }
    }

    vi.advanceTimersByTime(700);
    expect(completeCb).toHaveBeenCalled();
    const result = completeCb.mock.calls[0][0];
    expect(result.completed).toBe(true);
    expect(result.quality).toBeGreaterThanOrEqual(0);
    expect(result.quality).toBeLessThanOrEqual(4);

    game.destroy();
    vi.useRealTimers();
  });
});
