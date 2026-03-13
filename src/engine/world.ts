import type { Tile, World, LeaderboardEntry } from './types'
import { TerrainType, DEFAULT_WORLD_SIZE } from './types'
import { createRng, randomInt, pickRandom } from './random'
import { placeEnemies } from './enemies'
import { selectLegacyNpcs, placeLegacyNpcs } from './legacy'

const PASSABLE_TERRAIN: TerrainType[] = [
  TerrainType.Forest,
  TerrainType.Meadow,
  TerrainType.Road,
]

const ALL_WILDERNESS: TerrainType[] = [
  TerrainType.Forest,
  TerrainType.Meadow,
  TerrainType.River,
  TerrainType.Lake,
  TerrainType.Road,
  TerrainType.Mountain,
  TerrainType.Swamp,
  TerrainType.Thicket,
]

const BIOME_WEIGHTS: Record<TerrainType, number> = {
  [TerrainType.Forest]: 25,
  [TerrainType.Meadow]: 25,
  [TerrainType.Road]: 10,
  [TerrainType.River]: 8,
  [TerrainType.Lake]: 5,
  [TerrainType.Mountain]: 10,
  [TerrainType.Swamp]: 7,
  [TerrainType.Thicket]: 8,
  [TerrainType.Village]: 2,
}

function weightedPick(rng: () => number, exclude?: TerrainType): TerrainType {
  const entries = ALL_WILDERNESS.filter((t) => t !== exclude)
  const totalWeight = entries.reduce((sum, t) => sum + BIOME_WEIGHTS[t], 0)
  let roll = rng() * totalWeight
  for (const terrain of entries) {
    roll -= BIOME_WEIGHTS[terrain]
    if (roll <= 0) return terrain
  }
  return entries[entries.length - 1]
}

/**
 * Spreads biome influence from a tile to its neighbours, creating natural clusters.
 * A neighbour has a chance to inherit the same terrain type.
 */
function spreadBiome(
  tiles: Tile[][],
  width: number,
  height: number,
  rng: () => number,
): void {
  const spreadChance = 0.45
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (rng() > spreadChance) continue
      const source = tiles[y][x]
      const neighbors = [
        y > 0 ? tiles[y - 1][x] : null,
        x < width - 1 ? tiles[y][x + 1] : null,
        y < height - 1 ? tiles[y + 1][x] : null,
        x > 0 ? tiles[y][x - 1] : null,
      ].filter((n): n is Tile => n !== null)

      if (neighbors.length > 0) {
        const target = pickRandom(rng, neighbors)
        if (target.terrain !== TerrainType.Village) {
          target.terrain = source.terrain
        }
      }
    }
  }
}

function createTile(x: number, y: number, terrain: TerrainType): Tile {
  return { x, y, terrain, isExplored: false, hasHiddenPath: false }
}

/**
 * Place a connected river that flows roughly from one edge toward another.
 */
function placeRiver(
  tiles: Tile[][],
  width: number,
  height: number,
  rng: () => number,
): void {
  let x = randomInt(rng, 0, width - 1)
  let y = 0
  while (y < height) {
    if (tiles[y][x].terrain !== TerrainType.Village) {
      tiles[y][x].terrain = TerrainType.River
    }
    y++
    const drift = randomInt(rng, -1, 1)
    x = Math.max(0, Math.min(width - 1, x + drift))
  }
}

export function generateWorld(
  seed: number,
  size: number = DEFAULT_WORLD_SIZE,
  leaderboard: LeaderboardEntry[] = [],
): World {
  const rng = createRng(seed)
  const width = size
  const height = size

  const tiles: Tile[][] = Array.from({ length: height }, (_, y) =>
    Array.from({ length: width }, (_, x) =>
      createTile(x, y, weightedPick(rng)),
    ),
  )

  // Biome clustering passes
  for (let pass = 0; pass < 3; pass++) {
    spreadBiome(tiles, width, height, rng)
  }

  // Place a river
  placeRiver(tiles, width, height, rng)

  // Place starting village in the bottom-left quadrant
  const startX = randomInt(rng, 1, Math.floor(width / 4))
  const startY = randomInt(rng, Math.floor((height * 3) / 4), height - 2)
  tiles[startY][startX].terrain = TerrainType.Village
  tiles[startY][startX].isExplored = true

  // Ensure passable tiles around the village so the player isn't stuck
  for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]] as const) {
    const nx = startX + dx
    const ny = startY + dy
    if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
      if (tiles[ny][nx].terrain === TerrainType.Mountain ||
          tiles[ny][nx].terrain === TerrainType.Lake) {
        tiles[ny][nx].terrain = pickRandom(rng, PASSABLE_TERRAIN)
      }
      tiles[ny][nx].isExplored = true
    }
  }

  // Place quest marker in opposite quadrant (top-right)
  const questX = randomInt(rng, Math.floor((width * 3) / 4), width - 2)
  const questY = randomInt(rng, 1, Math.floor(height / 4))

  // Scatter a few extra villages
  const extraVillages = randomInt(rng, 2, 4)
  for (let i = 0; i < extraVillages; i++) {
    const vx = randomInt(rng, 1, width - 2)
    const vy = randomInt(rng, 1, height - 2)
    if (tiles[vy][vx].terrain !== TerrainType.Village &&
        !(vx === questX && vy === questY)) {
      tiles[vy][vx].terrain = TerrainType.Village
    }
  }

  // Sparse enemy placement (skip villages and starting area)
  placeEnemies(tiles, width, height, rng)
  // Clear enemies from the starting village and its immediate surroundings
  tiles[startY][startX].enemyId = undefined
  for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]] as const) {
    const nx = startX + dx
    const ny = startY + dy
    if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
      tiles[ny][nx].enemyId = undefined
    }
  }

  if (leaderboard.length > 0) {
    const legacyNpcs = selectLegacyNpcs(leaderboard, rng)
    placeLegacyNpcs(tiles, width, height, legacyNpcs, rng)
  }

  return {
    width,
    height,
    tiles,
    questMarker: { x: questX, y: questY },
  }
}

export function findStartingPosition(world: World): { x: number; y: number } {
  for (let y = 0; y < world.height; y++) {
    for (let x = 0; x < world.width; x++) {
      if (
        world.tiles[y][x].terrain === TerrainType.Village &&
        world.tiles[y][x].isExplored
      ) {
        return { x, y }
      }
    }
  }
  return { x: 0, y: 0 }
}
