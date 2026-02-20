import { gameState } from './GameState.js';
import { eventBus } from './EventBus.js';
import { SAVE_KEY, SAVE_VERSION, TIER_NAMES } from './constants.js';

interface SaveEnvelope {
  version: number;
  timestamp: number;
  data: string;
}

export class SaveSystem {
  save(): boolean {
    try {
      const envelope: SaveEnvelope = {
        version: SAVE_VERSION,
        timestamp: Date.now(),
        data: gameState.serialize(),
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(envelope));
      eventBus.emit('game:saved', {});
      return true;
    } catch {
      return false;
    }
  }

  load(): boolean {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;

      const envelope = JSON.parse(raw) as SaveEnvelope;
      if (!envelope || typeof envelope.version !== 'number') {
        return false;
      }

      if (envelope.version !== SAVE_VERSION) {
        return this.migrate(envelope);
      }

      const success = gameState.deserialize(envelope.data);
      if (success) {
        gameState.cleanExpiredCooldowns();
        eventBus.emit('game:loaded', {});
      }
      return success;
    } catch {
      return false;
    }
  }

  private migrate(envelope: SaveEnvelope): boolean {
    if (envelope.version === 1 || envelope.version === 2) {
      // v1 -> v2: reputation (number) -> raceReputation (Record)
      // v2 -> v3: upgrades (string[]) -> upgradeRanks (Record<string, number>)
      // deserialize handles both migrations internally
      const success = gameState.deserialize(envelope.data);
      if (success) {
        gameState.cleanExpiredCooldowns();
        this.save();
        eventBus.emit('game:loaded', {});
      }
      return success;
    }
    return false;
  }

  hasSave(): boolean {
    return localStorage.getItem(SAVE_KEY) !== null;
  }

  getSaveTier(): number | null {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const envelope = JSON.parse(raw) as SaveEnvelope;
      if (!envelope?.data) return null;
      const parsed = JSON.parse(envelope.data) as { currentTier?: number };
      return typeof parsed.currentTier === 'number' ? parsed.currentTier : null;
    } catch {
      return null;
    }
  }

  getSaveMetadata(): {
    coins: number;
    currentTier: number;
    tierName: string;
    timestamp: number;
    itemsSold: number;
    inventoryCount: number;
  } | null {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const envelope = JSON.parse(raw) as SaveEnvelope;
      if (!envelope?.data) return null;
      const parsed = JSON.parse(envelope.data) as {
        coins?: number;
        currentTier?: number;
        itemsSold?: number;
        inventory?: unknown[];
      };
      if (typeof parsed.coins !== 'number') return null;
      const tier = typeof parsed.currentTier === 'number' ? parsed.currentTier : 0;
      return {
        coins: parsed.coins,
        currentTier: tier,
        tierName: TIER_NAMES[tier] ?? 'Unknown',
        timestamp: envelope.timestamp ?? 0,
        itemsSold: typeof parsed.itemsSold === 'number' ? parsed.itemsSold : 0,
        inventoryCount: Array.isArray(parsed.inventory) ? parsed.inventory.length : 0,
      };
    } catch {
      return null;
    }
  }

  deleteSave(): void {
    localStorage.removeItem(SAVE_KEY);
  }

  autoSaveInterval(ms: number = 30_000): () => void {
    const id = setInterval(() => this.save(), ms);
    return () => clearInterval(id);
  }
}

export const saveSystem = new SaveSystem();
