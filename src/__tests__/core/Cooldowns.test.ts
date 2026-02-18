import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { GameState } from '../../core/GameState.js';
import { eventBus } from '../../core/EventBus.js';

describe('Cooldowns', () => {
  let state: GameState;

  beforeEach(() => {
    state = new GameState();
    eventBus.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should not be on cooldown by default', () => {
    expect(state.isOnCooldown('iron_dagger')).toBe(false);
    expect(state.getCooldownRemaining('iron_dagger')).toBe(0);
  });

  it('should start and track a cooldown', () => {
    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now);

    state.startCooldown('iron_dagger', 36);
    expect(state.isOnCooldown('iron_dagger')).toBe(true);
    expect(state.getCooldownRemaining('iron_dagger')).toBe(36);
  });

  it('should expire cooldown after duration elapses', () => {
    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now);

    state.startCooldown('iron_dagger', 36);
    expect(state.isOnCooldown('iron_dagger')).toBe(true);

    vi.spyOn(Date, 'now').mockReturnValue(now + 37000);
    expect(state.isOnCooldown('iron_dagger')).toBe(false);
    expect(state.getCooldownRemaining('iron_dagger')).toBe(0);
  });

  it('should track per-item cooldowns independently', () => {
    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now);

    state.startCooldown('iron_dagger', 36);
    state.startCooldown('wooden_shield', 36);

    expect(state.isOnCooldown('iron_dagger')).toBe(true);
    expect(state.isOnCooldown('wooden_shield')).toBe(true);
    expect(state.isOnCooldown('rat_jerky')).toBe(false);
  });

  it('should apply quick_hands reduction for tier 0-1 items', () => {
    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now);

    state.addUpgrade('quick_hands');
    state.startCooldown('iron_dagger', 36); // tier 0, 36 * 0.75 = 27
    expect(state.getCooldownRemaining('iron_dagger')).toBe(27);
  });

  it('should NOT apply quick_hands to tier 2+ items', () => {
    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now);

    state.addUpgrade('quick_hands');
    state.startCooldown('elven_bow', 135); // tier 2, should stay 135
    expect(state.getCooldownRemaining('elven_bow')).toBe(135);
  });

  it('should apply efficient_workshop reduction for craftable items', () => {
    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now);

    state.addUpgrade('efficient_workshop');
    state.startCooldown('iron_dagger', 36); // craftable, 36 * 0.80 = 28.8 -> 29
    expect(state.getCooldownRemaining('iron_dagger')).toBeLessThanOrEqual(29);
    expect(state.getCooldownRemaining('iron_dagger')).toBeGreaterThanOrEqual(28);
  });

  it('should apply supply_chain reduction for buyable items', () => {
    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now);

    state.addUpgrade('supply_chain');
    state.startCooldown('rat_jerky', 24); // not craftable, 24 * 0.80 = 19.2 -> 19
    expect(state.getCooldownRemaining('rat_jerky')).toBe(19);
  });

  it('should apply master_supplier reduction to all items', () => {
    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now);

    state.addUpgrade('master_supplier');
    state.startCooldown('elven_bow', 135); // 135 * 0.75 = 101.25 -> 101
    const remaining = state.getCooldownRemaining('elven_bow');
    expect(remaining).toBeLessThanOrEqual(101);
    expect(remaining).toBeGreaterThanOrEqual(100);
  });

  it('should stack multiple upgrade reductions multiplicatively', () => {
    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now);

    state.addUpgrade('quick_hands');
    state.addUpgrade('efficient_workshop');
    state.addUpgrade('master_supplier');
    // iron_dagger: tier 0, craftable
    // 36 * 0.75 (quick_hands) * 0.80 (efficient_workshop) * 0.75 (master_supplier) = 16.2 -> 16
    state.startCooldown('iron_dagger', 36);
    const remaining = state.getCooldownRemaining('iron_dagger');
    expect(remaining).toBeLessThanOrEqual(17);
    expect(remaining).toBeGreaterThanOrEqual(16);
  });

  it('should clean expired cooldowns', () => {
    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now);

    state.startCooldown('iron_dagger', 36);
    state.startCooldown('elven_bow', 135);

    vi.spyOn(Date, 'now').mockReturnValue(now + 40000);
    state.cleanExpiredCooldowns();

    expect(state.isOnCooldown('iron_dagger')).toBe(false);
    expect(state.isOnCooldown('elven_bow')).toBe(true);
  });

  it('should persist cooldowns through serialization', () => {
    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now);

    state.startCooldown('iron_dagger', 36);
    const json = state.serialize();

    const newState = new GameState();
    vi.spyOn(Date, 'now').mockReturnValue(now + 10000);
    newState.deserialize(json);

    expect(newState.isOnCooldown('iron_dagger')).toBe(true);
    expect(newState.getCooldownRemaining('iron_dagger')).toBe(26);
  });
});
