import { eventBus } from './EventBus.js';
import {
  MAX_COINS,
  TIER_THRESHOLDS,
  TIER_NAMES,
  TIER_REPUTATION_REQUIRED,
  STALL_BASE_SLOTS,
} from './constants.js';

export interface InventoryItem {
  id: string;
  goodsId: string;
  quality: number;
  enchanted: boolean;
  enchantMultiplier: number;
  basePrice: number;
}

export interface GameStateData {
  coins: number;
  reputation: number;
  currentTier: number;
  inventory: InventoryItem[];
  stallSlots: number;
  upgrades: string[];
  unlockedRecipes: string[];
  milestones: string[];
  totalEarned: number;
  totalSpent: number;
  itemsCrafted: number;
  itemsSold: number;
  haggleWins: number;
  haggleLosses: number;
}

function createDefaultState(): GameStateData {
  return {
    coins: 50,
    reputation: 0,
    currentTier: 0,
    inventory: [],
    stallSlots: STALL_BASE_SLOTS,
    upgrades: [],
    unlockedRecipes: ['iron_dagger', 'wooden_shield', 'herb_pouch'],
    milestones: [],
    totalEarned: 0,
    totalSpent: 0,
    itemsCrafted: 0,
    itemsSold: 0,
    haggleWins: 0,
    haggleLosses: 0,
  };
}

class GameState {
  private state: GameStateData;

  constructor() {
    this.state = createDefaultState();
  }

  get data(): Readonly<GameStateData> {
    return this.state;
  }

  get coins(): number {
    return this.state.coins;
  }

  get reputation(): number {
    return this.state.reputation;
  }

  get currentTier(): number {
    return this.state.currentTier;
  }

  get tierName(): string {
    return TIER_NAMES[this.state.currentTier];
  }

  get inventory(): readonly InventoryItem[] {
    return this.state.inventory;
  }

  get stallSlots(): number {
    return this.state.stallSlots;
  }

  get hasMaxCoins(): boolean {
    return this.state.coins >= MAX_COINS;
  }

  addCoins(amount: number, source: string): void {
    if (amount <= 0) return;
    const clamped = Math.min(amount, MAX_COINS - this.state.coins);
    this.state.coins += clamped;
    this.state.totalEarned += clamped;
    eventBus.emit('coins:earned', { amount: clamped, source });
    eventBus.emit('coins:changed', { amount: clamped, total: this.state.coins });
  }

  spendCoins(amount: number, item: string): boolean {
    if (amount <= 0 || this.state.coins < amount) return false;
    this.state.coins -= amount;
    this.state.totalSpent += amount;
    eventBus.emit('coins:spent', { amount, item });
    eventBus.emit('coins:changed', { amount: -amount, total: this.state.coins });
    return true;
  }

  addReputation(amount: number): void {
    if (amount <= 0) return;
    this.state.reputation += amount;
    eventBus.emit('reputation:changed', { amount, total: this.state.reputation });
    this.checkTierUnlock();
  }

  private checkTierUnlock(): void {
    const nextTier = this.state.currentTier + 1;
    if (nextTier >= TIER_NAMES.length) return;
    if (
      this.state.coins >= TIER_THRESHOLDS[nextTier] &&
      this.state.reputation >= TIER_REPUTATION_REQUIRED[nextTier]
    ) {
      this.state.currentTier = nextTier;
      eventBus.emit('tier:unlocked', {
        tier: nextTier,
        name: TIER_NAMES[nextTier],
      });
    }
  }

  addToInventory(item: InventoryItem): boolean {
    if (this.state.inventory.length >= this.state.stallSlots) return false;
    this.state.inventory.push(item);
    eventBus.emit('inventory:changed', {});
    return true;
  }

  removeFromInventory(itemId: string): InventoryItem | null {
    const idx = this.state.inventory.findIndex((i) => i.id === itemId);
    if (idx === -1) return null;
    const [item] = this.state.inventory.splice(idx, 1);
    eventBus.emit('inventory:changed', {});
    return item;
  }

  addUpgrade(upgradeId: string): void {
    if (!this.state.upgrades.includes(upgradeId)) {
      this.state.upgrades.push(upgradeId);
      eventBus.emit('upgrade:purchased', { upgradeId });
    }
  }

  hasUpgrade(upgradeId: string): boolean {
    return this.state.upgrades.includes(upgradeId);
  }

  unlockRecipe(recipeId: string): void {
    if (!this.state.unlockedRecipes.includes(recipeId)) {
      this.state.unlockedRecipes.push(recipeId);
      eventBus.emit('recipe:unlocked', { recipeId });
    }
  }

  hasRecipe(recipeId: string): boolean {
    return this.state.unlockedRecipes.includes(recipeId);
  }

  addMilestone(milestoneId: string): void {
    if (!this.state.milestones.includes(milestoneId)) {
      this.state.milestones.push(milestoneId);
      eventBus.emit('milestone:reached', { milestoneId });
    }
  }

  hasMilestone(milestoneId: string): boolean {
    return this.state.milestones.includes(milestoneId);
  }

  incrementStallSlots(): void {
    this.state.stallSlots++;
    eventBus.emit('stall:upgraded', { slots: this.state.stallSlots });
  }

  recordCraft(): void {
    this.state.itemsCrafted++;
  }

  recordSale(): void {
    this.state.itemsSold++;
  }

  recordHaggle(won: boolean): void {
    if (won) {
      this.state.haggleWins++;
    } else {
      this.state.haggleLosses++;
    }
  }

  reset(): void {
    this.state = createDefaultState();
  }

  serialize(): string {
    return JSON.stringify(this.state);
  }

  deserialize(json: string): boolean {
    try {
      const parsed = JSON.parse(json) as GameStateData;
      if (typeof parsed.coins !== 'number' || typeof parsed.reputation !== 'number') {
        return false;
      }
      this.state = { ...createDefaultState(), ...parsed };
      return true;
    } catch {
      return false;
    }
  }
}

export const gameState = new GameState();
export { GameState };
