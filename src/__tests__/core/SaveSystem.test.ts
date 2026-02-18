import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SaveSystem } from '../../core/SaveSystem.js';
import { gameState } from '../../core/GameState.js';
import { eventBus } from '../../core/EventBus.js';
import { SAVE_KEY } from '../../core/constants.js';

describe('SaveSystem', () => {
  let saveSystem: SaveSystem;

  beforeEach(() => {
    saveSystem = new SaveSystem();
    gameState.reset();
    eventBus.clear();
    localStorage.clear();
  });

  it('should save and load game state', () => {
    gameState.addCoins(200, 'test');
    gameState.addRaceReputation('goblin', 15);
    gameState.addRaceReputation('human', 10);

    const saved = saveSystem.save();
    expect(saved).toBe(true);

    gameState.reset();
    expect(gameState.coins).toBe(50);

    const loaded = saveSystem.load();
    expect(loaded).toBe(true);
    expect(gameState.coins).toBe(250);
    expect(gameState.reputation).toBe(25);
    expect(gameState.getRaceReputation('goblin')).toBe(15);
    expect(gameState.getRaceReputation('human')).toBe(10);
  });

  it('should detect existing save', () => {
    expect(saveSystem.hasSave()).toBe(false);
    saveSystem.save();
    expect(saveSystem.hasSave()).toBe(true);
  });

  it('should delete save', () => {
    saveSystem.save();
    saveSystem.deleteSave();
    expect(saveSystem.hasSave()).toBe(false);
  });

  it('should return false when loading with no save', () => {
    const loaded = saveSystem.load();
    expect(loaded).toBe(false);
  });

  it('should return false for corrupted save data', () => {
    localStorage.setItem(SAVE_KEY, 'corrupted data');
    const loaded = saveSystem.load();
    expect(loaded).toBe(false);
  });

  it('should emit game:saved event on save', () => {
    const cb = vi.fn();
    eventBus.on('game:saved', cb);
    saveSystem.save();
    expect(cb).toHaveBeenCalled();
  });

  it('should emit game:loaded event on load', () => {
    saveSystem.save();
    const cb = vi.fn();
    eventBus.on('game:loaded', cb);
    saveSystem.load();
    expect(cb).toHaveBeenCalled();
  });

  it('should setup auto-save interval', () => {
    vi.useFakeTimers();
    const saveSpy = vi.spyOn(saveSystem, 'save');
    const cancel = saveSystem.autoSaveInterval(1000);

    vi.advanceTimersByTime(3000);
    expect(saveSpy).toHaveBeenCalledTimes(3);

    cancel();
    vi.advanceTimersByTime(2000);
    expect(saveSpy).toHaveBeenCalledTimes(3);

    vi.useRealTimers();
  });
});
