import { gameState } from './GameState.js';
import { eventBus } from './EventBus.js';
import { SAVE_KEY, SAVE_VERSION } from './constants.js';

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

  deleteSave(): void {
    localStorage.removeItem(SAVE_KEY);
  }

  autoSaveInterval(ms: number = 30_000): () => void {
    const id = setInterval(() => this.save(), ms);
    return () => clearInterval(id);
  }
}

export const saveSystem = new SaveSystem();
