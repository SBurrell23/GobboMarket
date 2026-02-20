import { gameState } from '../core/GameState.js';

export interface RecipeDefinition {
  id: string;
  name: string;
  goodsId: string;
  cost: number;
  tier: number;
}

export const RECIPES: RecipeDefinition[] = [
  // Tier 0 - default unlocked
  { id: 'iron_dagger', name: 'Iron Dagger', goodsId: 'iron_dagger', cost: 0, tier: 0 },
  { id: 'wooden_shield', name: 'Wooden Shield', goodsId: 'wooden_shield', cost: 0, tier: 0 },
  { id: 'herb_pouch', name: 'Herb Tincture', goodsId: 'herb_pouch', cost: 0, tier: 0 },

  // Tier 1
  { id: 'steel_sword', name: 'Steel Sword', goodsId: 'steel_sword', cost: 100, tier: 1 },
  { id: 'chainmail', name: 'Chainmail Shirt', goodsId: 'chainmail', cost: 120, tier: 1 },
  { id: 'healing_potion', name: 'Healing Potion', goodsId: 'healing_potion', cost: 80, tier: 1 },

  // Tier 2
  { id: 'elven_bow', name: 'Elven Bow', goodsId: 'elven_bow', cost: 500, tier: 2 },
  { id: 'plate_armor', name: 'Plate Armor', goodsId: 'plate_armor', cost: 600, tier: 2 },
  { id: 'mana_elixir', name: 'Mana Elixir', goodsId: 'mana_elixir', cost: 400, tier: 2 },

  // Tier 3
  { id: 'war_hammer', name: 'War Hammer', goodsId: 'war_hammer', cost: 1200, tier: 3 },
  { id: 'scale_mail', name: 'Scale Mail', goodsId: 'scale_mail', cost: 1400, tier: 3 },
  { id: 'strength_tonic', name: 'Strength Tonic', goodsId: 'strength_tonic', cost: 900, tier: 3 },

  // Tier 4
  { id: 'mithril_blade', name: 'Mithril Blade', goodsId: 'mithril_blade', cost: 2500, tier: 4 },
  { id: 'dragon_scale_mail', name: 'Dragon Scale Mail', goodsId: 'dragon_scale_mail', cost: 3000, tier: 4 },
  { id: 'phoenix_tears', name: 'Phoenix Tears', goodsId: 'phoenix_tears', cost: 2000, tier: 4 },

  // Tier 5
  { id: 'runic_greatsword', name: 'Runic Greatsword', goodsId: 'runic_greatsword', cost: 6000, tier: 5 },
  { id: 'arcane_ward', name: 'Arcane Ward', goodsId: 'arcane_ward', cost: 7000, tier: 5 },
  { id: 'invisibility_draught', name: 'Invisibility Draught', goodsId: 'invisibility_draught', cost: 5000, tier: 5 },

  // Tier 6
  { id: 'vorpal_sword', name: 'Vorpal Sword', goodsId: 'vorpal_sword', cost: 15000, tier: 6 },
  { id: 'adamantine_plate', name: 'Adamantine Plate', goodsId: 'adamantine_plate', cost: 18000, tier: 6 },
  { id: 'elixir_of_life', name: 'Elixir of Life', goodsId: 'elixir_of_life', cost: 12000, tier: 6 },

  // Tier 7
  { id: 'blade_of_ages', name: 'Blade of Ages', goodsId: 'blade_of_ages', cost: 35000, tier: 7 },
  { id: 'celestial_armor', name: 'Celestial Armor', goodsId: 'celestial_armor', cost: 40000, tier: 7 },
  { id: 'time_flask', name: 'Time Flask', goodsId: 'time_flask', cost: 28000, tier: 7 },

  // Tier 8
  { id: 'godslayer', name: 'Godslayer', goodsId: 'godslayer', cost: 80000, tier: 8 },
  { id: 'world_aegis', name: 'World Aegis', goodsId: 'world_aegis', cost: 95000, tier: 8 },
  { id: 'essence_of_creation', name: 'Essence of Creation', goodsId: 'essence_of_creation', cost: 65000, tier: 8 },
];

export function getAvailableRecipes(): RecipeDefinition[] {
  return RECIPES.filter(r =>
    r.tier <= gameState.currentTier && !gameState.hasRecipe(r.id)
  );
}

export function purchaseRecipe(recipeId: string): boolean {
  const recipe = RECIPES.find(r => r.id === recipeId);
  if (!recipe) return false;
  if (gameState.hasRecipe(recipeId)) return false;
  if (recipe.cost > 0 && !gameState.spendCoins(recipe.cost, `Recipe: ${recipe.name}`)) return false;

  gameState.unlockRecipe(recipeId);
  return true;
}

export function getUnlockedRecipeIds(): string[] {
  return RECIPES.filter(r => gameState.hasRecipe(r.id)).map(r => r.goodsId);
}
