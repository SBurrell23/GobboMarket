import { eventBus } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';
import { CUSTOMER_TYPES, TIER_MAX_CUSTOMERS, TIER_NAMES, TIER_RACE_REPUTATION_REQUIRED } from '../core/constants.js';
import { type Customer, createCustomer, getAvailableCustomerTypes } from './Customer.js';
const BASE_SPAWN_INTERVAL = 5000;
const MIN_SPAWN_INTERVAL = 2500;

export class CustomerQueue {
  private queue: Customer[] = [];
  private spawnTimer: ReturnType<typeof setTimeout> | null = null;

  get customers(): readonly Customer[] {
    return this.queue;
  }

  get length(): number {
    return this.queue.length;
  }

  start(): void {
    this.spawnCustomer();
    this.scheduleSpawn();
  }

  stop(): void {
    if (this.spawnTimer) {
      clearTimeout(this.spawnTimer);
      this.spawnTimer = null;
    }
  }

  private scheduleSpawn(): void {
    const tier = gameState.currentTier;
    let interval = Math.max(
      MIN_SPAWN_INTERVAL,
      BASE_SPAWN_INTERVAL - tier * 1000
    );
    interval *= 1 - gameState.getUpgradeRank('market_sign') * 0.05;
    interval = Math.round(interval);
    const jitter = (Math.random() - 0.5) * interval * 0.3;
    this.spawnTimer = setTimeout(() => {
      this.spawnCustomer();
      this.scheduleSpawn();
    }, interval + jitter);
  }

  private pickWeightedCustomerType(types: (typeof CUSTOMER_TYPES)[number][]): (typeof CUSTOMER_TYPES)[number] {
    const currentTier = gameState.currentTier;
    const nextTier = currentTier + 1;
    if (nextTier >= TIER_NAMES.length) {
      return types[Math.floor(Math.random() * types.length)];
    }
    const raceReqs = TIER_RACE_REPUTATION_REQUIRED[nextTier] ?? {};
    const weights = types.map((type) => {
      const req = raceReqs[type];
      if (req == null) return 1;
      return gameState.getRaceReputation(type) < req ? 4 : 1;
    });
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < types.length; i++) {
      r -= weights[i];
      if (r <= 0) return types[i];
    }
    return types[types.length - 1];
  }

  private spawnCustomer(): void {
    const maxCustomers = TIER_MAX_CUSTOMERS[Math.min(gameState.currentTier, TIER_MAX_CUSTOMERS.length - 1)];
    if (this.queue.length >= maxCustomers) return;
    const types = getAvailableCustomerTypes(gameState.currentTier);
    const type = this.pickWeightedCustomerType(types);
    const customer = createCustomer(type);
    this.queue.push(customer);
    eventBus.emit('customer:arrived', { customerId: customer.id, type: customer.type });
    this.startPatienceTimer(customer);
  }

  private startPatienceTimer(customer: Customer): void {
    const timeout = customer.patience * 20000;
    setTimeout(() => {
      const idx = this.queue.findIndex(c => c.id === customer.id);
      if (idx !== -1) {
        this.queue.splice(idx, 1);
        eventBus.emit('customer:left', { customerId: customer.id, satisfied: false });
      }
    }, timeout);
  }

  removeCustomer(customerId: string): Customer | null {
    const idx = this.queue.findIndex(c => c.id === customerId);
    if (idx === -1) return null;
    const [customer] = this.queue.splice(idx, 1);
    return customer;
  }

  forceSpawn(): void {
    this.spawnCustomer();
  }

  clear(): void {
    this.queue = [];
    this.stop();
  }
}

export const customerQueue = new CustomerQueue();
