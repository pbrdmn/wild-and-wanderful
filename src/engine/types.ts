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

export interface Tile {
  x: number
  y: number
  terrain: TerrainType
  isExplored: boolean
  hasHiddenPath: boolean
}

export interface World {
  width: number
  height: number
  tiles: Tile[][]
  questMarker: { x: number; y: number }
}

export interface Player {
  x: number
  y: number
  ap: number
  maxAp: number
  name: string
  level: number
  wounds: number
  maxWounds: number
}

export interface Enemy {
  name: string
  strength: number
}

export interface ActiveEnemy extends Enemy {
  hasInitiative: boolean
}

export type GamePhase = 'exploring' | 'combat' | 'resting'

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
export const AP_COST_MOVE = 1
export const AP_COST_REST = 1
export const AP_COST_SEARCH = 1

export const AMBUSH_CHANCE = 0.1
export const SEARCH_REVEAL_CHANCE = 0.3
