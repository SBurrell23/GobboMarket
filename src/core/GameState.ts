import { eventBus } from './EventBus.js';
import {
  MAX_COINS,
  TIER_THRESHOLDS,
  TIER_NAMES,
  TIER_RACE_REPUTATION_REQUIRED,
  STALL_BASE_SLOTS,
} from './constants.js';
import { getGoodsById } from '../market/Goods.js';

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
  raceReputation: Record<string, number>;
  currentTier: number;
  inventory: InventoryItem[];
  stallSlots: number;
  /** @deprecated Use upgradeRanks. Present only for migration. */
  upgrades?: string[];
  upgradeRanks: Record<string, number>;
  unlockedRecipes: string[];
  milestones: string[];
  totalEarned: number;
  totalSpent: number;
  itemsCrafted: number;
  craftsByQuality: Record<number, number>;
  itemsSold: number;
  haggleWins: number;
  haggleLosses: number;
  cooldowns: Record<string, number>;
}

function createDefaultState(): GameStateData {
  return {
    coins: 50,
    raceReputation: {},
    currentTier: 0,
    inventory: [],
    stallSlots: STALL_BASE_SLOTS,
    upgradeRanks: {},
    unlockedRecipes: ['iron_dagger', 'wooden_shield', 'herb_pouch'],
    milestones: [],
    totalEarned: 0,
    totalSpent: 0,
    itemsCrafted: 0,
    craftsByQuality: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 },
    itemsSold: 0,
    haggleWins: 0,
    haggleLosses: 0,
    cooldowns: {},
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
    return Object.values(this.state.raceReputation).reduce((sum, v) => sum + v, 0);
  }

  getRaceReputation(race: string): number {
    return this.state.raceReputation[race] ?? 0;
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
    this.checkTierUnlock();
  }

  spendCoins(amount: number, item: string): boolean {
    if (amount <= 0 || this.state.coins < amount) return false;
    this.state.coins -= amount;
    this.state.totalSpent += amount;
    eventBus.emit('coins:spent', { amount, item });
    eventBus.emit('coins:changed', { amount: -amount, total: this.state.coins });
    return true;
  }

  addRaceReputation(race: string, amount: number): void {
    const current = this.state.raceReputation[race] ?? 0;
    const newVal = Math.max(0, current + amount);
    this.state.raceReputation[race] = newVal;
    const actualChange = newVal - current;
    if (actualChange !== 0) {
      eventBus.emit('reputation:changed', { amount: actualChange, total: this.reputation, race });
      this.checkTierUnlock();
    }
  }

  private checkTierUnlock(): void {
    let advanced = true;
    while (advanced) {
      advanced = false;
      const nextTier = this.state.currentTier + 1;
      if (nextTier >= TIER_NAMES.length) return;
      if (this.state.coins < TIER_THRESHOLDS[nextTier]) continue;

      const raceReqs = TIER_RACE_REPUTATION_REQUIRED[nextTier];
      if (raceReqs) {
        const allMet = Object.entries(raceReqs).every(
          ([race, req]) => this.getRaceReputation(race) >= req,
        );
        if (!allMet) continue;
      }

      this.state.currentTier = nextTier;
      eventBus.emit('tier:unlocked', {
        tier: nextTier,
        name: TIER_NAMES[nextTier],
      });
      advanced = true;
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

  getUpgradeRank(upgradeId: string): number {
    return this.state.upgradeRanks[upgradeId] ?? 0;
  }

  addUpgradeRank(upgradeId: string): void {
    const prev = this.state.upgradeRanks[upgradeId] ?? 0;
    this.state.upgradeRanks[upgradeId] = prev + 1;
    eventBus.emit('upgrade:purchased', { upgradeId });
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

  recordCraft(quality?: number): void {
    this.state.itemsCrafted++;
    this.recordAcquiredQuality(quality);
  }

  recordAcquiredQuality(quality?: number): void {
    const q = Math.min(4, Math.max(0, quality ?? 0));
    this.state.craftsByQuality ??= { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
    this.state.craftsByQuality[q] = (this.state.craftsByQuality[q] ?? 0) + 1;
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

  isOnCooldown(goodsId: string): boolean {
    const expiry = this.state.cooldowns[goodsId];
    if (!expiry) return false;
    if (Date.now() >= expiry) {
      delete this.state.cooldowns[goodsId];
      return false;
    }
    return true;
  }

  getCooldownRemaining(goodsId: string): number {
    const expiry = this.state.cooldowns[goodsId];
    if (!expiry) return 0;
    return Math.max(0, Math.ceil((expiry - Date.now()) / 1000));
  }

  getEffectiveCooldown(goodsId: string): number {
    const goods = getGoodsById(goodsId);
    if (!goods) return 0;
    let duration = goods.cooldown;

    if (this.getUpgradeRank('efficient_workshop') > 0 && goods.craftable) {
      duration *= 1 - this.getUpgradeRank('efficient_workshop') * 0.10;
    }
    if (this.getUpgradeRank('supply_chain') > 0 && !goods.craftable) {
      duration *= 1 - this.getUpgradeRank('supply_chain') * 0.10;
    }
    if (this.getUpgradeRank('master_supplier') > 0) {
      duration *= 1 - this.getUpgradeRank('master_supplier') * 0.10;
    }

    return Math.round(duration);
  }

  startCooldown(goodsId: string, baseDurationSec: number): void {
    const duration = this.getEffectiveCooldown(goodsId) || baseDurationSec;
    this.state.cooldowns[goodsId] = Date.now() + Math.round(duration * 1000);
  }

  cleanExpiredCooldowns(): void {
    const now = Date.now();
    for (const id in this.state.cooldowns) {
      if (this.state.cooldowns[id] <= now) {
        delete this.state.cooldowns[id];
      }
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
      const parsed = JSON.parse(json) as GameStateData & { reputation?: number };
      if (typeof parsed.coins !== 'number') {
        return false;
      }
      // Migrate old single-number reputation to per-race
      if (typeof parsed.reputation === 'number' && !parsed.raceReputation) {
        const oldRep = parsed.reputation;
        parsed.raceReputation = {
          goblin: Math.floor(oldRep / 2),
          human: Math.ceil(oldRep / 2),
        };
        delete parsed.reputation;
      }
      // Migrate upgrades[] to upgradeRanks (v2 -> v3)
      if (parsed.upgrades && Array.isArray(parsed.upgrades) && (!parsed.upgradeRanks || Object.keys(parsed.upgradeRanks).length === 0)) {
        parsed.upgradeRanks = {};
        for (const id of parsed.upgrades) {
          parsed.upgradeRanks[id] = 1;
        }
        delete parsed.upgrades;
      }
      const base = createDefaultState();
      let upgradeRanks = parsed.upgradeRanks ?? base.upgradeRanks;
      // Migrate quick_hands -> reputation_boost
      if (upgradeRanks['quick_hands']) {
        upgradeRanks = { ...upgradeRanks };
        upgradeRanks['reputation_boost'] = upgradeRanks['quick_hands'];
        delete upgradeRanks['quick_hands'];
      }
      // Remove deprecated merchant_guild (upgrade removed)
      if (upgradeRanks['merchant_guild']) {
        upgradeRanks = { ...upgradeRanks };
        delete upgradeRanks['merchant_guild'];
      }
      this.state = {
        ...base,
        ...parsed,
        upgradeRanks,
        craftsByQuality: parsed.craftsByQuality ?? base.craftsByQuality,
      };
      return true;
    } catch {
      return false;
    }
  }
}

export const gameState = new GameState();
export { GameState };
