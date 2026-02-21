export type EventCallback<T = unknown> = (data: T) => void;

export interface GameEvents {
  'coins:changed': { amount: number; total: number };
  'coins:earned': { amount: number; source: string };
  'coins:spent': { amount: number; item: string };
  'reputation:changed': { amount: number; total: number; race: string };
  'tier:unlocked': { tier: number; name: string };
  'item:crafted': { itemId: string; quality: number };
  'item:sold': { itemId: string; price: number; customerId: string };
  'item:bought': { itemId: string; price: number };
  'customer:arrived': { customerId: string; type: string };
  'customer:left': { customerId: string; satisfied: boolean };
  'minigame:started': { type: string };
  'minigame:completed': { type: string; score: number };
  'upgrade:purchased': { upgradeId: string };
  'recipe:unlocked': { recipeId: string };
  'milestone:reached': { milestoneId: string };
  'cooldown:ready': { goodsId: string };
  'game:saved': Record<string, never>;
  'game:loaded': Record<string, never>;
  'screen:changed': { screen: string };
  'inventory:changed': Record<string, never>;
  'stall:upgraded': { slots: number };
  'victory:show': Record<string, never>;
  'music:track_started': { filename: string };
}

export type GameEventName = keyof GameEvents;

export class EventBus {
  private listeners = new Map<string, Set<EventCallback<never>>>();

  on<K extends GameEventName>(event: K, callback: EventCallback<GameEvents[K]>): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback as EventCallback<never>);
  }

  off<K extends GameEventName>(event: K, callback: EventCallback<GameEvents[K]>): void {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(callback as EventCallback<never>);
      if (set.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  emit<K extends GameEventName>(event: K, data: GameEvents[K]): void {
    const set = this.listeners.get(event);
    if (set) {
      for (const callback of set) {
        callback(data as never);
      }
    }
  }

  clear(): void {
    this.listeners.clear();
  }

  listenerCount(event: GameEventName): number {
    return this.listeners.get(event)?.size ?? 0;
  }
}

export const eventBus = new EventBus();
