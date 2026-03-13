import type { Player, Tile, TerrainType, Item } from './types'
import { TerrainType as TT, ItemCategory } from './types'

export type DiscoveryType = 'item' | 'npc' | 'event'

export type DiscoveryEffect =
  | { type: 'heal'; amount: number }
  | { type: 'xp'; amount: number }
  | { type: 'item'; item: Omit<Item, 'id'> }
  | { type: 'narrative' }

export interface DiscoveryTemplate {
  id: string
  name: string
  description: string
  discoveryType: DiscoveryType
  biomes: readonly TerrainType[]
  effect: DiscoveryEffect
}

export const DISCOVERY_REGISTRY: readonly DiscoveryTemplate[] = [
  {
    id: 'mushroom-patch',
    name: 'Mushroom Patch',
    description: 'You find a cluster of healing mushrooms nestled among the roots. Their soft glow promises relief.',
    discoveryType: 'event',
    biomes: [TT.Forest],
    effect: { type: 'heal', amount: 1 },
  },
  {
    id: 'owl-sage',
    name: 'Owl Sage',
    description: 'A wise old owl perches on a low branch and shares ancient wisdom about the wilds.',
    discoveryType: 'npc',
    biomes: [TT.Forest],
    effect: { type: 'xp', amount: 2 },
  },
  {
    id: 'sunlit-cache',
    name: 'Sunlit Cache',
    description: 'Sunlight catches something glinting in the tall grass. A traveller\'s forgotten bundle!',
    discoveryType: 'event',
    biomes: [TT.Meadow],
    effect: {
      type: 'item',
      item: {
        name: 'Rough-Hewn Club',
        category: ItemCategory.Melee,
        description: 'A sturdy branch shaped into a crude but effective weapon.',
        attackPower: 2,
        flavourText: 'Simple, but it gets the job done.',
      },
    },
  },
  {
    id: 'travelling-merchant',
    name: 'Travelling Merchant',
    description: 'A cheerful hedgehog merchant trundles past with a cart of trinkets. "Safe travels, friend!" they call.',
    discoveryType: 'npc',
    biomes: [TT.Meadow, TT.Road],
    effect: { type: 'narrative' },
  },
  {
    id: 'milestone-shrine',
    name: 'Milestone Shrine',
    description: 'A mossy stone shrine marks a crossroads. You pause to pay respects and feel invigorated.',
    discoveryType: 'event',
    biomes: [TT.Road],
    effect: { type: 'xp', amount: 3 },
  },
  {
    id: 'abandoned-cart',
    name: 'Abandoned Cart',
    description: 'An overturned cart sits by the roadside. Among the scattered goods you find something useful.',
    discoveryType: 'event',
    biomes: [TT.Road],
    effect: {
      type: 'item',
      item: {
        name: 'Traveller\'s Shortbow',
        category: ItemCategory.Ranged,
        description: 'A compact bow left behind by a hasty traveller.',
        attackPower: 1,
        flavourText: 'Small enough to carry, accurate enough to hunt.',
      },
    },
  },
  {
    id: 'herbalist',
    name: 'Village Herbalist',
    description: 'A kindly mouse herbalist notices your weariness and offers a poultice. "Rest easy, little one."',
    discoveryType: 'npc',
    biomes: [TT.Village],
    effect: { type: 'heal', amount: 1 },
  },
  {
    id: 'storyteller',
    name: 'Fireside Storyteller',
    description: 'An elderly badger invites you to sit by the fire and shares tales of heroes past. You learn from their wisdom.',
    discoveryType: 'npc',
    biomes: [TT.Village],
    effect: { type: 'xp', amount: 2 },
  },
  {
    id: 'freshwater-spring',
    name: 'Freshwater Spring',
    description: 'Crystal-clear water bubbles up from between the stones. Drinking deeply, you feel your strength return.',
    discoveryType: 'event',
    biomes: [TT.River],
    effect: { type: 'heal', amount: 1 },
  },
  {
    id: 'old-campsite',
    name: 'Old Campsite',
    description: 'The remains of a campfire and a weathered pack. Inside you find a charm left behind.',
    discoveryType: 'event',
    biomes: [TT.Forest, TT.Meadow],
    effect: {
      type: 'item',
      item: {
        name: 'Flickering Charm',
        category: ItemCategory.Magic,
        description: 'A small stone that pulses with faint warmth.',
        attackPower: 1,
        flavourText: 'It remembers the fire that once warmed it.',
      },
    },
  },
  {
    id: 'wanderers-journal',
    name: 'Wanderer\'s Journal',
    description: 'A leather-bound journal lies open on a rock. Reading its pages, you glean hard-won knowledge.',
    discoveryType: 'event',
    biomes: [TT.Forest, TT.Meadow, TT.Road, TT.Mountain],
    effect: { type: 'xp', amount: 2 },
  },
  {
    id: 'fairy-ring',
    name: 'Fairy Ring',
    description: 'A perfect circle of toadstools glows faintly in the dim light. You step inside and feel a tingle of magic.',
    discoveryType: 'event',
    biomes: [TT.Forest, TT.Thicket],
    effect: { type: 'xp', amount: 3 },
  },
  {
    id: 'lost-hatchet',
    name: 'Lost Hatchet',
    description: 'Half-buried in the mud, a small hatchet with a worn handle. Still sharp enough to be useful.',
    discoveryType: 'event',
    biomes: [TT.Swamp, TT.Thicket],
    effect: {
      type: 'item',
      item: {
        name: 'Rusty Hatchet',
        category: ItemCategory.Melee,
        description: 'A battered hatchet reclaimed from the wild.',
        attackPower: 2,
        flavourText: 'Rust and all, it still bites.',
      },
    },
  },
  {
    id: 'singing-frog',
    name: 'Singing Frog',
    description: 'A frog on a lily pad croaks a hauntingly beautiful melody. You feel oddly at peace.',
    discoveryType: 'npc',
    biomes: [TT.River, TT.Lake, TT.Swamp],
    effect: { type: 'heal', amount: 1 },
  },
  {
    id: 'mountain-vista',
    name: 'Mountain Vista',
    description: 'From a rocky outcrop you catch a breathtaking view of the lands below. The perspective teaches you something.',
    discoveryType: 'event',
    biomes: [TT.Mountain],
    effect: { type: 'xp', amount: 2 },
  },
]

const DISCOVERY_PLACEMENT_CHANCE = 0.15

export function getDiscoveriesForBiome(terrain: TerrainType): DiscoveryTemplate[] {
  return DISCOVERY_REGISTRY.filter((d) => d.biomes.includes(terrain))
}

export function placeDiscoveries(
  tiles: Tile[][],
  width: number,
  height: number,
  rng: () => number,
): void {
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const tile = tiles[y][x]
      if (tile.enemyId) continue
      if (tile.legacyNpc) continue
      if (rng() >= DISCOVERY_PLACEMENT_CHANCE) continue

      const candidates = getDiscoveriesForBiome(tile.terrain)
      if (candidates.length === 0) continue

      const picked = candidates[Math.floor(rng() * candidates.length)]
      tile.discoveryId = picked.id
    }
  }
}

export function getDiscoveryById(id: string): DiscoveryTemplate | undefined {
  return DISCOVERY_REGISTRY.find((d) => d.id === id)
}

let discoveryItemCounter = 1000

export interface DiscoveryResult {
  player: Player
  message: string
}

export function resolveDiscovery(
  player: Player,
  discoveryId: string,
): DiscoveryResult | null {
  const template = getDiscoveryById(discoveryId)
  if (!template) return null

  let updatedPlayer = { ...player }
  let message = template.description

  switch (template.effect.type) {
    case 'heal': {
      if (updatedPlayer.wounds > 0) {
        const healed = Math.min(template.effect.amount, updatedPlayer.wounds)
        updatedPlayer = { ...updatedPlayer, wounds: updatedPlayer.wounds - healed }
        message += ` (Healed ${healed} wound${healed > 1 ? 's' : ''})`
      }
      break
    }
    case 'xp': {
      updatedPlayer = { ...updatedPlayer, xp: updatedPlayer.xp + template.effect.amount }
      message += ` (+${template.effect.amount} XP)`
      break
    }
    case 'item': {
      const newItem: Item = {
        ...template.effect.item,
        id: `found-${discoveryItemCounter++}`,
      }
      if (updatedPlayer.inventory.items.length < updatedPlayer.inventory.maxSlots) {
        updatedPlayer = {
          ...updatedPlayer,
          inventory: {
            ...updatedPlayer.inventory,
            items: [...updatedPlayer.inventory.items, newItem],
          },
        }
        message += ` (Found: ${newItem.name})`
      } else {
        message += ' (Your pack is full!)'
      }
      break
    }
    case 'narrative':
      break
  }

  return { player: updatedPlayer, message }
}

export function resetDiscoveryItemCounter(): void {
  discoveryItemCounter = 1000
}
