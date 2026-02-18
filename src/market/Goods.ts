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
  cooldown: number;
}

const ALL_GOODS: GoodsDefinition[] = [
  // Tier 0 - Muddy Alley (Forge 36s / Buy 24s)
  { id: 'iron_dagger', name: 'Iron Dagger', icon: '🗡️', basePrice: 15, category: 'weapon', tier: 0, description: 'A simple iron dagger. Sharp enough.', craftable: true, materialCost: 8, cooldown: 36 },
  { id: 'wooden_shield', name: 'Wooden Shield', icon: '🛡️', basePrice: 12, category: 'armor', tier: 0, description: 'Rough-hewn pine shield.', craftable: true, materialCost: 6, cooldown: 36 },
  { id: 'herb_pouch', name: 'Herb Drink', icon: '🌿', basePrice: 8, category: 'potion', tier: 0, description: 'A refreshing herbal remedy.', craftable: true, materialCost: 4, cooldown: 36 },
  { id: 'rat_jerky', name: 'Rat Jerky', icon: '🍖', basePrice: 5, category: 'food', tier: 0, description: 'Chewy but filling. Goblin favorite.', craftable: false, materialCost: 3, cooldown: 24 },
  { id: 'rusty_ring', name: 'Rusty Ring', icon: '💍', basePrice: 10, category: 'trinket', tier: 0, description: 'Might be worth something... or not.', craftable: false, materialCost: 5, cooldown: 24 },

  // Tier 1 - Back Alley Bazaar (Forge 69s / Buy 45s)
  { id: 'steel_sword', name: 'Steel Sword', icon: '⚔️', basePrice: 45, category: 'weapon', tier: 1, description: 'A proper steel blade.', craftable: true, materialCost: 25, cooldown: 69 },
  { id: 'chainmail', name: 'Chainmail Shirt', icon: '🪖', basePrice: 55, category: 'armor', tier: 1, description: 'Interlocking iron rings.', craftable: true, materialCost: 30, cooldown: 69 },
  { id: 'healing_potion', name: 'Healing Potion', icon: '🧪', basePrice: 35, category: 'potion', tier: 1, description: 'Glows faintly red. Restores vitality.', craftable: true, materialCost: 18, cooldown: 69 },
  { id: 'mushroom_stew', name: 'Mushroom Stew', icon: '🍲', basePrice: 20, category: 'food', tier: 1, description: 'Hearty forest mushroom stew.', craftable: false, materialCost: 10, cooldown: 45 },
  { id: 'crystal_pendant', name: 'Crystal Pendant', icon: '📿', basePrice: 40, category: 'trinket', tier: 1, description: 'A polished quartz pendant.', craftable: false, materialCost: 20, cooldown: 45 },

  // Tier 2 - Market Square (Forge 135s / Buy 90s)
  { id: 'elven_bow', name: 'Elven Bow', icon: '🏹', basePrice: 150, category: 'weapon', tier: 2, description: 'Graceful yew bow with elven markings.', craftable: true, materialCost: 80, cooldown: 135 },
  { id: 'plate_armor', name: 'Plate Armor', icon: '🛡️', basePrice: 200, category: 'armor', tier: 2, description: 'Full plate. Heavy but protective.', craftable: true, materialCost: 110, cooldown: 135 },
  { id: 'mana_elixir', name: 'Mana Elixir', icon: '💎', basePrice: 120, category: 'potion', tier: 2, description: 'Shimmering blue liquid. Restores magical energy.', craftable: true, materialCost: 65, cooldown: 135 },
  { id: 'dragonfire_ale', name: 'Dragonfire Ale', icon: '🍺', basePrice: 80, category: 'food', tier: 2, description: 'Burns going down. Dwarven specialty.', craftable: false, materialCost: 40, cooldown: 90 },
  { id: 'enchanted_amulet', name: 'Enchanted Amulet', icon: '🔮', basePrice: 180, category: 'trinket', tier: 2, description: 'Pulses with faint magical energy.', craftable: false, materialCost: 95, cooldown: 90 },

  // Tier 3 - Trader's Row (Forge 225s / Buy 159s)
  { id: 'war_hammer', name: 'War Hammer', icon: '🔨', basePrice: 280, category: 'weapon', tier: 3, description: 'A heavy dwarven war hammer.', craftable: true, materialCost: 150, cooldown: 225 },
  { id: 'scale_mail', name: 'Scale Mail', icon: '🐍', basePrice: 320, category: 'armor', tier: 3, description: 'Overlapping metal scales, surprisingly flexible.', craftable: true, materialCost: 175, cooldown: 225 },
  { id: 'strength_tonic', name: 'Strength Tonic', icon: '💪', basePrice: 200, category: 'potion', tier: 3, description: 'Temporarily grants the strength of an ogre.', craftable: true, materialCost: 110, cooldown: 225 },
  { id: 'elven_bread', name: 'Elven Waybread', icon: '🍞', basePrice: 150, category: 'food', tier: 3, description: 'One bite sustains a traveler for a full day.', craftable: false, materialCost: 80, cooldown: 159 },
  { id: 'moonstone_ring', name: 'Moonstone Ring', icon: '💍', basePrice: 250, category: 'trinket', tier: 3, description: 'Glows softly under starlight.', craftable: false, materialCost: 135, cooldown: 159 },

  // Tier 4 - Merchant Quarter (Forge 360s / Buy 249s)
  { id: 'mithril_blade', name: 'Mithril Blade', icon: '🗡️', basePrice: 500, category: 'weapon', tier: 4, description: 'Light as a feather, strong as dragon scale.', craftable: true, materialCost: 280, cooldown: 360 },
  { id: 'dragon_scale_mail', name: 'Dragon Scale Mail', icon: '🐉', basePrice: 650, category: 'armor', tier: 4, description: 'Armor forged from genuine dragon scales.', craftable: true, materialCost: 350, cooldown: 360 },
  { id: 'phoenix_tears', name: 'Phoenix Tears', icon: '✨', basePrice: 400, category: 'potion', tier: 4, description: 'A vial of liquid rebirth.', craftable: true, materialCost: 220, cooldown: 360 },
  { id: 'royal_feast', name: 'Royal Feast', icon: '🍗', basePrice: 300, category: 'food', tier: 4, description: 'A spread fit for a king.', craftable: false, materialCost: 160, cooldown: 249 },
  { id: 'crown_jewel', name: 'Crown Jewel', icon: '👑', basePrice: 550, category: 'trinket', tier: 4, description: 'A gem of extraordinary brilliance.', craftable: false, materialCost: 300, cooldown: 249 },

  // Tier 5 - Guild District (Forge 540s / Buy 384s)
  { id: 'runic_greatsword', name: 'Runic Greatsword', icon: '⚔️', basePrice: 1200, category: 'weapon', tier: 5, description: 'Covered in glowing runic inscriptions.', craftable: true, materialCost: 650, cooldown: 540 },
  { id: 'arcane_ward', name: 'Arcane Ward', icon: '🛡️', basePrice: 1400, category: 'armor', tier: 5, description: 'Shimmering magical barrier made solid.', craftable: true, materialCost: 760, cooldown: 540 },
  { id: 'invisibility_draught', name: 'Invisibility Draught', icon: '👻', basePrice: 900, category: 'potion', tier: 5, description: 'Renders the drinker unseen for one hour.', craftable: true, materialCost: 500, cooldown: 540 },
  { id: 'fairy_cake', name: 'Fairy Cake', icon: '🧁', basePrice: 700, category: 'food', tier: 5, description: 'Baked by the fey. Grants temporary flight.', craftable: false, materialCost: 380, cooldown: 384 },
  { id: 'orb_of_storms', name: 'Orb of Storms', icon: '🌩️', basePrice: 1100, category: 'trinket', tier: 5, description: 'Crackles with captured lightning.', craftable: false, materialCost: 600, cooldown: 384 },

  // Tier 6 - Royal Bazaar (Forge 810s / Buy 540s)
  { id: 'vorpal_sword', name: 'Vorpal Sword', icon: '⚔️', basePrice: 2500, category: 'weapon', tier: 6, description: 'Cuts through reality itself.', craftable: true, materialCost: 1350, cooldown: 810 },
  { id: 'adamantine_plate', name: 'Adamantine Plate', icon: '🛡️', basePrice: 3000, category: 'armor', tier: 6, description: 'Nearly indestructible divine armor.', craftable: true, materialCost: 1650, cooldown: 810 },
  { id: 'elixir_of_life', name: 'Elixir of Life', icon: '🧬', basePrice: 2200, category: 'potion', tier: 6, description: 'Grants eternal youth... temporarily.', craftable: true, materialCost: 1200, cooldown: 810 },
  { id: 'ambrosia', name: 'Ambrosia', icon: '🍯', basePrice: 1800, category: 'food', tier: 6, description: 'Food of the gods.', craftable: false, materialCost: 980, cooldown: 540 },
  { id: 'philosophers_stone', name: "Philosopher's Stone", icon: '💎', basePrice: 3500, category: 'trinket', tier: 6, description: 'Transmutes the mundane into the extraordinary.', craftable: false, materialCost: 1900, cooldown: 540 },

  // Tier 7 - Diamond Exchange (Forge 1125s / Buy 765s)
  { id: 'blade_of_ages', name: 'Blade of Ages', icon: '🗡️', basePrice: 6000, category: 'weapon', tier: 7, description: 'Forged before recorded history. Still razor sharp.', craftable: true, materialCost: 3300, cooldown: 1125 },
  { id: 'celestial_armor', name: 'Celestial Armor', icon: '🌟', basePrice: 7500, category: 'armor', tier: 7, description: 'Woven from starlight and divine protection.', craftable: true, materialCost: 4100, cooldown: 1125 },
  { id: 'time_flask', name: 'Time Flask', icon: '⏳', basePrice: 5000, category: 'potion', tier: 7, description: 'Freezes a moment in time. Handle with extreme care.', craftable: true, materialCost: 2750, cooldown: 1125 },
  { id: 'dragon_heart_steak', name: 'Dragon Heart Steak', icon: '🥩', basePrice: 4000, category: 'food', tier: 7, description: 'Grants fire resistance and immense vigor.', craftable: false, materialCost: 2200, cooldown: 765 },
  { id: 'void_pearl', name: 'Void Pearl', icon: '🖤', basePrice: 6500, category: 'trinket', tier: 7, description: 'A pearl from the spaces between worlds.', craftable: false, materialCost: 3550, cooldown: 765 },

  // Tier 8 - Grand Exchange (Forge 1620s / Buy 1080s)
  { id: 'godslayer', name: 'Godslayer', icon: '⚔️', basePrice: 15000, category: 'weapon', tier: 8, description: 'The weapon of legends. Fells even immortals.', craftable: true, materialCost: 8200, cooldown: 1620 },
  { id: 'world_aegis', name: 'World Aegis', icon: '🛡️', basePrice: 18000, category: 'armor', tier: 8, description: 'Shield that protected the world from oblivion.', craftable: true, materialCost: 9800, cooldown: 1620 },
  { id: 'essence_of_creation', name: 'Essence of Creation', icon: '🌌', basePrice: 12000, category: 'potion', tier: 8, description: 'A drop of the primordial substance.', craftable: true, materialCost: 6600, cooldown: 1620 },
  { id: 'feast_of_kings', name: 'Feast of Kings', icon: '👑', basePrice: 10000, category: 'food', tier: 8, description: 'A legendary meal that empowers entire armies.', craftable: false, materialCost: 5500, cooldown: 1080 },
  { id: 'infinity_gem', name: 'Infinity Gem', icon: '💎', basePrice: 20000, category: 'trinket', tier: 8, description: 'Contains a fragment of infinite power.', craftable: false, materialCost: 11000, cooldown: 1080 },
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
