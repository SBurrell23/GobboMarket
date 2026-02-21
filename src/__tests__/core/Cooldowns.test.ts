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

  it('should apply efficient_workshop reduction for craftable items', () => {
    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now);

    state.addUpgradeRank('efficient_workshop');
    state.startCooldown('iron_dagger', 36); // craftable, 36 * (1 - 0.10) = 32.4 -> 32
    expect(state.getCooldownRemaining('iron_dagger')).toBe(32);
  });

  it('should apply supply_chain reduction for buyable items', () => {
    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now);

    state.addUpgradeRank('supply_chain');
    state.startCooldown('rat_jerky', 24); // not craftable, 24 * (1 - 0.10) = 21.6 -> 22
    expect(state.getCooldownRemaining('rat_jerky')).toBe(22);
  });

  it('should apply master_supplier reduction to all items', () => {
    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now);

    state.addUpgradeRank('master_supplier');
    state.startCooldown('elven_bow', 135); // 135 * (1 - 0.10) = 121.5 -> 122
    expect(state.getCooldownRemaining('elven_bow')).toBe(122);
  });

  it('should stack multiple upgrade reductions multiplicatively', () => {
    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now);

    state.addUpgradeRank('efficient_workshop');
    state.addUpgradeRank('master_supplier');
    // elven_bow: tier 2, craftable - gets both
    // 135 * 0.90 * 0.90 = 109.35 -> 109
    state.startCooldown('elven_bow', 135);
    const remaining = state.getCooldownRemaining('elven_bow');
    expect(remaining).toBeLessThanOrEqual(110);
    expect(remaining).toBeGreaterThanOrEqual(108);
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
