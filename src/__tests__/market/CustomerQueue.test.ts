import { describe, it, expect, beforeEach } from 'vitest';
import { createCustomer, getAvailableCustomerTypes, resetCustomerIds } from '../../market/Customer.js';
import { CUSTOMER_TYPES } from '../../core/constants.js';

describe('Customer', () => {
  beforeEach(() => {
    resetCustomerIds();
  });

  it('should create a customer with valid properties', () => {
    const c = createCustomer('goblin');
    expect(c.id).toBe('customer-0');
    expect(c.type).toBe('goblin');
    expect(c.icon).toBe('👺');
    expect(c.name).toBeTruthy();
    expect(c.patience).toBeGreaterThan(0);
    expect(['poor', 'medium', 'tough']).toContain(c.haggleTier);
  });

  it('should increment customer IDs', () => {
    const c1 = createCustomer('goblin');
    const c2 = createCustomer('human');
    expect(c1.id).toBe('customer-0');
    expect(c2.id).toBe('customer-1');
  });

  it('should return available customer types for tier', () => {
    const tier0 = getAvailableCustomerTypes(0);
    expect(tier0).toContain('goblin');
    expect(tier0).toContain('human');
    expect(tier0).not.toContain('noble');
    expect(tier0).not.toContain('wizard');

    const tier8 = getAvailableCustomerTypes(8);
    expect(tier8).toContain('wizard');
    expect(tier8.length).toBe(CUSTOMER_TYPES.length);
  });

  it('should set budget multiplier based on type', () => {
    const noble = createCustomer('noble');
    expect(noble.budgetMultiplier).toBe(1.5);

    const goblin = createCustomer('goblin');
    expect(goblin.budgetMultiplier).toBe(0.8);
  });
});
