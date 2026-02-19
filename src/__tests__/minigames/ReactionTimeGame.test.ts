import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ReactionTimeGame } from '../../minigames/ReactionTimeGame.js';

describe('ReactionTimeGame', () => {
  let game: ReactionTimeGame;
  let container: HTMLElement;

  beforeEach(() => {
    vi.useFakeTimers();
    game = new ReactionTimeGame();
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    vi.useRealTimers();
    game?.destroy();
    container?.remove();
  });

  it('should start in waiting phase', () => {
    game.start(container);
    expect(game.getState().phase).toBe('waiting');
  });

  it('should implement Minigame interface', () => {
    expect(game.type).toBe('appraisal');
    expect(typeof game.start).toBe('function');
    expect(typeof game.destroy).toBe('function');
    expect(game.onComplete).toBeNull();
  });

  it('should create game area with Wait text', () => {
    game.start(container);
    expect(container.querySelector('#reaction-game-area')).toBeTruthy();
    expect(container.textContent).toContain('Wait');
  });

  it('should show Buy after delay', () => {
    game.start(container);
    vi.runAllTimers();
    expect(game.getState().phase).toBe('ready');
    expect(container.textContent).toContain('Buy!');
  });

  it('should call onComplete when done button is clicked', () => {
    const onComplete = vi.fn();
    game.onComplete = onComplete;
    game.start(container);
    vi.runAllTimers();
    (container.querySelector('#reaction-game-area') as HTMLElement).dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    (container.querySelector('.done-btn') as HTMLElement)?.click();
    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        quality: expect.any(Number),
        score: expect.any(Number),
        multiplier: 1,
        completed: true,
      })
    );
  });

  it('should yield quality 0 for early click', () => {
    const onComplete = vi.fn();
    game.onComplete = onComplete;
    game.start(container);
    vi.advanceTimersByTime(500);
    (container.querySelector('#reaction-game-area') as HTMLElement).dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    (container.querySelector('.done-btn') as HTMLElement)?.click();
    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({ quality: 0, score: 0 })
    );
  });

  it('should destroy and clear container', () => {
    game.start(container);
    vi.advanceTimersByTime(1000);
    game.destroy();
    expect(container.innerHTML).toBe('');
  });

  it('should map fast reaction to high quality', () => {
    const onComplete = vi.fn();
    game.onComplete = onComplete;
    game.start(container);
    vi.runAllTimers();
    vi.advanceTimersByTime(100);
    (container.querySelector('#reaction-game-area') as HTMLElement).dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    (container.querySelector('.done-btn') as HTMLElement)?.click();
    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({ quality: 4 })
    );
  });
});
