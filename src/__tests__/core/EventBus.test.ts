import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventBus } from '../../core/EventBus.js';

describe('EventBus', () => {
  let bus: EventBus;

  beforeEach(() => {
    bus = new EventBus();
  });

  it('should call listeners when event is emitted', () => {
    const callback = vi.fn();
    bus.on('coins:changed', callback);
    bus.emit('coins:changed', { amount: 10, total: 60 });
    expect(callback).toHaveBeenCalledWith({ amount: 10, total: 60 });
  });

  it('should support multiple listeners on same event', () => {
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    bus.on('coins:changed', cb1);
    bus.on('coins:changed', cb2);
    bus.emit('coins:changed', { amount: 5, total: 55 });
    expect(cb1).toHaveBeenCalledTimes(1);
    expect(cb2).toHaveBeenCalledTimes(1);
  });

  it('should not call removed listeners', () => {
    const callback = vi.fn();
    bus.on('coins:changed', callback);
    bus.off('coins:changed', callback);
    bus.emit('coins:changed', { amount: 10, total: 60 });
    expect(callback).not.toHaveBeenCalled();
  });

  it('should not fail when emitting with no listeners', () => {
    expect(() => {
      bus.emit('coins:changed', { amount: 10, total: 60 });
    }).not.toThrow();
  });

  it('should clear all listeners', () => {
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    bus.on('coins:changed', cb1);
    bus.on('coins:earned', cb2);
    bus.clear();
    bus.emit('coins:changed', { amount: 10, total: 60 });
    bus.emit('coins:earned', { amount: 10, source: 'sale' });
    expect(cb1).not.toHaveBeenCalled();
    expect(cb2).not.toHaveBeenCalled();
  });

  it('should report listener count', () => {
    const cb = vi.fn();
    expect(bus.listenerCount('coins:changed')).toBe(0);
    bus.on('coins:changed', cb);
    expect(bus.listenerCount('coins:changed')).toBe(1);
    bus.off('coins:changed', cb);
    expect(bus.listenerCount('coins:changed')).toBe(0);
  });

  it('should handle off for non-existent listener gracefully', () => {
    const cb = vi.fn();
    expect(() => bus.off('coins:changed', cb)).not.toThrow();
  });
});
