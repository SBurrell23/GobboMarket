export interface GoodsDefinition {
  id: string;
  name: string;
  icon: string;
  basePrice: number;
  category: 'weapon' | 'armor' | 'potion' | 'trinket' | 'food' | 'material';
  tier: number;
  description: string;
  craftable: boolean;
  materialCost: number;
}

const ALL_GOODS: GoodsDefinition[] = [
  // Tier 0 - Muddy Alley
  { id: 'iron_dagger', name: 'Iron Dagger', icon: '🗡️', basePrice: 15, category: 'weapon', tier: 0, description: 'A simple iron dagger. Sharp enough.', craftable: true, materialCost: 8 },
  { id: 'wooden_shield', name: 'Wooden Shield', icon: '🛡️', basePrice: 12, category: 'armor', tier: 0, description: 'Rough-hewn pine shield.', craftable: true, materialCost: 6 },
  { id: 'herb_pouch', name: 'Herb Pouch', icon: '🌿', basePrice: 8, category: 'potion', tier: 0, description: 'A pouch of common healing herbs.', craftable: true, materialCost: 4 },
  { id: 'rat_jerky', name: 'Rat Jerky', icon: '🍖', basePrice: 5, category: 'food', tier: 0, description: 'Chewy but filling. Goblin favorite.', craftable: false, materialCost: 3 },
  { id: 'rusty_ring', name: 'Rusty Ring', icon: '💍', basePrice: 10, category: 'trinket', tier: 0, description: 'Might be worth something... or not.', craftable: false, materialCost: 5 },

  // Tier 1 - Market Square
  { id: 'steel_sword', name: 'Steel Sword', icon: '⚔️', basePrice: 45, category: 'weapon', tier: 1, description: 'A proper steel blade.', craftable: true, materialCost: 25 },
  { id: 'chainmail', name: 'Chainmail Shirt', icon: '🪖', basePrice: 55, category: 'armor', tier: 1, description: 'Interlocking iron rings.', craftable: true, materialCost: 30 },
  { id: 'healing_potion', name: 'Healing Potion', icon: '🧪', basePrice: 35, category: 'potion', tier: 1, description: 'Glows faintly red. Restores vitality.', craftable: true, materialCost: 18 },
  { id: 'mushroom_stew', name: 'Mushroom Stew', icon: '🍲', basePrice: 20, category: 'food', tier: 1, description: 'Hearty forest mushroom stew.', craftable: false, materialCost: 10 },
  { id: 'crystal_pendant', name: 'Crystal Pendant', icon: '📿', basePrice: 40, category: 'trinket', tier: 1, description: 'A polished quartz pendant.', craftable: false, materialCost: 20 },

  // Tier 2 - Merchant Quarter
  { id: 'elven_bow', name: 'Elven Bow', icon: '🏹', basePrice: 150, category: 'weapon', tier: 2, description: 'Graceful yew bow with elven markings.', craftable: true, materialCost: 80 },
  { id: 'plate_armor', name: 'Plate Armor', icon: '🛡️', basePrice: 200, category: 'armor', tier: 2, description: 'Full plate. Heavy but protective.', craftable: true, materialCost: 110 },
  { id: 'mana_elixir', name: 'Mana Elixir', icon: '💎', basePrice: 120, category: 'potion', tier: 2, description: 'Shimmering blue liquid. Restores magical energy.', craftable: true, materialCost: 65 },
  { id: 'dragonfire_ale', name: 'Dragonfire Ale', icon: '🍺', basePrice: 80, category: 'food', tier: 2, description: 'Burns going down. Dwarven specialty.', craftable: false, materialCost: 40 },
  { id: 'enchanted_amulet', name: 'Enchanted Amulet', icon: '🔮', basePrice: 180, category: 'trinket', tier: 2, description: 'Pulses with faint magical energy.', craftable: false, materialCost: 95 },

  // Tier 3 - Royal Bazaar
  { id: 'mithril_blade', name: 'Mithril Blade', icon: '🗡️', basePrice: 500, category: 'weapon', tier: 3, description: 'Light as a feather, strong as dragon scale.', craftable: true, materialCost: 280 },
  { id: 'dragon_scale_mail', name: 'Dragon Scale Mail', icon: '🐉', basePrice: 650, category: 'armor', tier: 3, description: 'Armor forged from genuine dragon scales.', craftable: true, materialCost: 350 },
  { id: 'phoenix_tears', name: 'Phoenix Tears', icon: '✨', basePrice: 400, category: 'potion', tier: 3, description: 'A vial of liquid rebirth.', craftable: true, materialCost: 220 },
  { id: 'royal_feast', name: 'Royal Feast', icon: '🍗', basePrice: 300, category: 'food', tier: 3, description: 'A spread fit for a king.', craftable: false, materialCost: 160 },
  { id: 'crown_jewel', name: 'Crown Jewel', icon: '👑', basePrice: 550, category: 'trinket', tier: 3, description: 'A gem of extraordinary brilliance.', craftable: false, materialCost: 300 },

  // Tier 4 - Grand Exchange
  { id: 'vorpal_sword', name: 'Vorpal Sword', icon: '⚔️', basePrice: 2000, category: 'weapon', tier: 4, description: 'Cuts through reality itself.', craftable: true, materialCost: 1100 },
  { id: 'adamantine_plate', name: 'Adamantine Plate', icon: '🛡️', basePrice: 2500, category: 'armor', tier: 4, description: 'Nearly indestructible divine armor.', craftable: true, materialCost: 1400 },
  { id: 'elixir_of_life', name: 'Elixir of Life', icon: '🧬', basePrice: 1800, category: 'potion', tier: 4, description: 'Grants eternal youth... temporarily.', craftable: true, materialCost: 1000 },
  { id: 'ambrosia', name: 'Ambrosia', icon: '🍯', basePrice: 1500, category: 'food', tier: 4, description: 'Food of the gods.', craftable: false, materialCost: 800 },
  { id: 'philosophers_stone', name: "Philosopher's Stone", icon: '💎', basePrice: 3000, category: 'trinket', tier: 4, description: 'Transmutes the mundane into the extraordinary.', craftable: false, materialCost: 1600 },
];

export function getGoodsById(id: string): GoodsDefinition | undefined {
  return ALL_GOODS.find(g => g.id === id);
}

export function getGoodsByTier(tier: number): GoodsDefinition[] {
  return ALL_GOODS.filter(g => g.tier <= tier);
}

export function getCraftableGoods(tier: number, unlockedRecipes: string[]): GoodsDefinition[] {
  return ALL_GOODS.filter(g => g.craftable && g.tier <= tier && unlockedRecipes.includes(g.id));
}

export function getBuyableGoods(tier: number): GoodsDefinition[] {
  return ALL_GOODS.filter(g => !g.craftable && g.tier <= tier);
}

export function getAllGoods(): GoodsDefinition[] {
  return [...ALL_GOODS];
}
