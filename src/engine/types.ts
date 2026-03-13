export const TerrainType = {
  Forest: 'forest',
  Meadow: 'meadow',
  River: 'river',
  Lake: 'lake',
  Road: 'road',
  Village: 'village',
  Mountain: 'mountain',
  Swamp: 'swamp',
  Thicket: 'thicket',
} as const

export type TerrainType = (typeof TerrainType)[keyof typeof TerrainType]

export const IMPASSABLE_TERRAIN: ReadonlySet<TerrainType> = new Set([
  TerrainType.Mountain,
  TerrainType.Swamp,
  TerrainType.Thicket,
])

export const AnimalSpecies = {
  Fox: 'fox',
  Bear: 'bear',
  Mouse: 'mouse',
  Raccoon: 'raccoon',
  Cat: 'cat',
  Bird: 'bird',
  Frog: 'frog',
} as const

export type AnimalSpecies = (typeof AnimalSpecies)[keyof typeof AnimalSpecies]

export interface LegacyNpc {
  name: string
  species: AnimalSpecies
  level: number
  questCompleted: boolean
  tileX: number
  tileY: number
}

export interface Tile {
  x: number
  y: number
  terrain: TerrainType
  isExplored: boolean
  hasHiddenPath: boolean
  enemyId?: string
  legacyNpc?: LegacyNpc
}

export interface World {
  width: number
  height: number
  tiles: Tile[][]
  questMarker: { x: number; y: number }
}

export const ItemCategory = {
  Melee: 'melee',
  Ranged: 'ranged',
  Magic: 'magic',
} as const

export type ItemCategory = (typeof ItemCategory)[keyof typeof ItemCategory]

export interface Item {
  id: string
  name: string
  category: ItemCategory
  description: string
  attackPower: number
  flavourText: string
}

export interface Inventory {
  items: Item[]
  equippedItemId: string | null
  maxSlots: number
}

export interface Player {
  x: number
  y: number
  ap: number
  maxAp: number
  name: string
  species: AnimalSpecies
  level: number
  xp: number
  wounds: number
  maxWounds: number
  inventory: Inventory
  unlockedSkillIds: string[]
  activeSkillIds: string[]
  maxActiveSkills: number
}

export interface Enemy {
  name: string
  strength: number
}

export type StatusEffectType = 'daze' | 'poison' | 'shield'

export interface StatusEffect {
  type: StatusEffectType
  remainingTurns: number
}

export type SkillCategory = 'offensive' | 'defensive' | 'utility'

export type SkillEffect =
  | { type: 'damage'; power: number }
  | { type: 'damage_status'; power: number; statusEffect: StatusEffectType; duration: number }
  | { type: 'status'; statusEffect: StatusEffectType; duration: number }
  | { type: 'dodge_next'; chance: number }

export interface Skill {
  id: string
  name: string
  description: string
  skillCategory: SkillCategory
  requiredItemCategory: ItemCategory
  apCost: number
  effect: SkillEffect
}

export interface ActiveEnemy extends Enemy {
  hp: number
  maxHp: number
  hasInitiative: boolean
  statusEffects: StatusEffect[]
}

export type GamePhase = 'intro' | 'exploring' | 'combat' | 'resting' | 'questComplete' | 'retired'

export interface LeaderboardEntry {
  id: string
  name: string
  species: AnimalSpecies
  level: number
  xp: number
  turnsSurvived: number
  questCompleted: boolean
  equippedItemName: string | null
  date: number
}

export interface GameState {
  world: World
  player: Player
  turnNumber: number
  gamePhase: GamePhase
  activeEnemy?: ActiveEnemy
}

export const Direction = {
  North: 'north',
  East: 'east',
  South: 'south',
  West: 'west',
} as const

export type Direction = (typeof Direction)[keyof typeof Direction]

export const DIRECTION_OFFSETS: Record<Direction, { dx: number; dy: number }> = {
  [Direction.North]: { dx: 0, dy: -1 },
  [Direction.East]: { dx: 1, dy: 0 },
  [Direction.South]: { dx: 0, dy: 1 },
  [Direction.West]: { dx: -1, dy: 0 },
}

export const DEFAULT_MAX_AP = 3
export const DEFAULT_WORLD_SIZE = 20

// AP is only consumed during combat. Movement, rest, and search are free during exploration.
export const AP_COST_SWAP = DEFAULT_MAX_AP
export const AP_COST_ATTACK = 1
export const AP_COST_FLEE = 1

export const AMBUSH_CHANCE = 0.1
export const BASE_FLEE_CHANCE = 0.7
export const SEARCH_REVEAL_CHANCE = 0.3

export const DEFAULT_INVENTORY_SLOTS = 5
export const DEFAULT_MAX_ACTIVE_SKILLS = 2

export const XP_LEVEL_THRESHOLDS = [0, 3, 8, 15, 25] as const
export const MAX_LEADERBOARD_ENTRIES = 50
