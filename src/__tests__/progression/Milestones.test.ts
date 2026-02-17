import { describe, it, expect, beforeEach } from 'vitest';
import { checkMilestones, getCompletedMilestones, getAllMilestones } from '../../progression/Milestones.js';
import { gameState } from '../../core/GameState.js';
import { eventBus } from '../../core/EventBus.js';

describe('Milestones', () => {
  beforeEach(() => {
    gameState.reset();
    eventBus.clear();
  });

  it('should have no completed milestones at start', () => {
    const completed = getCompletedMilestones();
    expect(completed).toHaveLength(0);
  });

  it('should detect first sale milestone', () => {
    gameState.recordSale();
    const newMilestones = checkMilestones();
    expect(newMilestones.some(m => m.id === 'first_sale')).toBe(true);
  });

  it('should detect first craft milestone', () => {
    gameState.recordCraft();
    const newMilestones = checkMilestones();
    expect(newMilestones.some(m => m.id === 'first_craft')).toBe(true);
  });

  it('should not double-count milestones', () => {
    gameState.recordSale();
    checkMilestones();
    const again = checkMilestones();
    expect(again.some(m => m.id === 'first_sale')).toBe(false);
  });

  it('should detect coin milestones', () => {
    gameState.addCoins(1000, 'test');
    const milestones = checkMilestones();
    expect(milestones.some(m => m.id === 'coins_1000')).toBe(true);
  });

  it('should track max coins milestone', () => {
    gameState.addCoins(1_000_000, 'test');
    const milestones = checkMilestones();
    expect(milestones.some(m => m.id === 'max_coins')).toBe(true);
  });

  it('should have a max_coins milestone defined', () => {
    const all = getAllMilestones();
    expect(all.some(m => m.id === 'max_coins')).toBe(true);
  });

  it('should return completed milestones after checking', () => {
    gameState.recordSale();
    gameState.recordCraft();
    checkMilestones();
    const completed = getCompletedMilestones();
    expect(completed.length).toBeGreaterThanOrEqual(2);
  });
});
