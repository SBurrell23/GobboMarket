import { eventBus } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';
import { type Customer, createCustomer, getAvailableCustomerTypes } from './Customer.js';

const MAX_QUEUE_SIZE = 5;
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
    if (gameState.hasUpgrade('market_sign')) {
      interval = Math.round(interval * 0.85);
    }
    const jitter = (Math.random() - 0.5) * interval * 0.3;
    this.spawnTimer = setTimeout(() => {
      this.spawnCustomer();
      this.scheduleSpawn();
    }, interval + jitter);
  }

  private spawnCustomer(): void {
    if (this.queue.length >= MAX_QUEUE_SIZE) return;
    const types = getAvailableCustomerTypes(gameState.currentTier);
    const type = types[Math.floor(Math.random() * types.length)];
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
