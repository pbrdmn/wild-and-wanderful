import { describe, it, expect } from 'vitest'
import { search } from '../../src/engine/search'
import type { Player, World, Tile } from '../../src/engine/types'
import { TerrainType, DEFAULT_MAX_AP, AP_COST_SEARCH } from '../../src/engine/types'
import { createRng } from '../../src/engine/random'

function makeTile(x: number, y: number, overrides: Partial<Tile> = {}): Tile {
  return {
    x, y,
    terrain: TerrainType.Meadow,
    isExplored: false,
    hasHiddenPath: false,
    ...overrides,
  }
}

function makeSmallWorld(
  center: Partial<Tile> = {},
  neighbors: Partial<Record<'north' | 'east' | 'south' | 'west', Partial<Tile>>> = {},
): World {
  const tiles: Tile[][] = Array.from({ length: 3 }, (_, y) =>
    Array.from({ length: 3 }, (_, x) => makeTile(x, y)),
  )
  if (center.terrain) tiles[1][1].terrain = center.terrain
  if (neighbors.north) Object.assign(tiles[0][1], neighbors.north)
  if (neighbors.south) Object.assign(tiles[2][1], neighbors.south)
  if (neighbors.east) Object.assign(tiles[1][2], neighbors.east)
  if (neighbors.west) Object.assign(tiles[1][0], neighbors.west)
  return { width: 3, height: 3, tiles, questMarker: { x: 2, y: 0 } }
}

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    x: 1, y: 1,
    ap: DEFAULT_MAX_AP, maxAp: DEFAULT_MAX_AP,
    name: 'Test', level: 1,
    wounds: 0, maxWounds: 1,
    ...overrides,
  }
}

function makeRngReturning(values: number[]): () => number {
  let i = 0
  return () => values[i++] ?? 0
}

describe('search', () => {
  it('deducts AP on successful search', () => {
    const player = makePlayer()
    const world = makeSmallWorld()
    const rng = makeRngReturning([0.5])
    const result = search(player, world, rng)
    expect(result.success).toBe(true)
    expect(result.player.ap).toBe(DEFAULT_MAX_AP - AP_COST_SEARCH)
  })

  it('fails when player has insufficient AP', () => {
    const player = makePlayer({ ap: 0 })
    const world = makeSmallWorld()
    const rng = makeRngReturning([0.5])
    const result = search(player, world, rng)
    expect(result.success).toBe(false)
    expect(result.reason).toContain('AP')
    expect(result.player.ap).toBe(0)
  })

  it('finds no path when there are no adjacent impassable tiles', () => {
    const player = makePlayer()
    const world = makeSmallWorld()
    const rng = makeRngReturning([0.1, 0.0])
    const result = search(player, world, rng)
    expect(result.success).toBe(true)
    expect(result.foundPath).toBe(false)
    expect(result.direction).toBeUndefined()
  })

  it('reveals a hidden path on an adjacent impassable tile when roll succeeds', () => {
    const player = makePlayer()
    const world = makeSmallWorld({}, {
      north: { terrain: TerrainType.Mountain },
    })
    // First roll: reveal chance (0.1 < 0.3), second: pick index
    const rng = makeRngReturning([0.1, 0.0])
    const result = search(player, world, rng)
    expect(result.success).toBe(true)
    expect(result.foundPath).toBe(true)
    expect(result.direction).toBe('north')
    expect(result.world.tiles[0][1].hasHiddenPath).toBe(true)
  })

  it('does not reveal when roll fails', () => {
    const player = makePlayer()
    const world = makeSmallWorld({}, {
      north: { terrain: TerrainType.Mountain },
    })
    // Roll 0.5 >= 0.3 → no reveal
    const rng = makeRngReturning([0.5])
    const result = search(player, world, rng)
    expect(result.success).toBe(true)
    expect(result.foundPath).toBe(false)
    expect(result.world.tiles[0][1].hasHiddenPath).toBe(false)
  })

  it('does not pick tiles that already have a hidden path', () => {
    const player = makePlayer()
    const world = makeSmallWorld({}, {
      north: { terrain: TerrainType.Mountain, hasHiddenPath: true },
    })
    const rng = makeRngReturning([0.1, 0.0])
    const result = search(player, world, rng)
    expect(result.foundPath).toBe(false)
  })

  it('picks among multiple impassable neighbours', () => {
    const player = makePlayer()
    const world = makeSmallWorld({}, {
      north: { terrain: TerrainType.Mountain },
      south: { terrain: TerrainType.Swamp },
      east: { terrain: TerrainType.Thicket },
    })
    // Roll reveal (0.1 < 0.3), then pick index for 3 candidates: floor(0.67*3) = 2
    const rng = makeRngReturning([0.1, 0.67])
    const result = search(player, world, rng)
    expect(result.foundPath).toBe(true)
    expect(result.direction).toBeDefined()
  })

  it('does not mutate the original player or world', () => {
    const player = makePlayer()
    const world = makeSmallWorld({}, {
      north: { terrain: TerrainType.Mountain },
    })
    const rng = makeRngReturning([0.1, 0.0])
    search(player, world, rng)
    expect(player.ap).toBe(DEFAULT_MAX_AP)
    expect(world.tiles[0][1].hasHiddenPath).toBe(false)
  })

  it('produces deterministic results with seeded RNG', () => {
    const player = makePlayer()
    const world1 = makeSmallWorld({}, {
      north: { terrain: TerrainType.Mountain },
    })
    const world2 = makeSmallWorld({}, {
      north: { terrain: TerrainType.Mountain },
    })
    const rng1 = createRng(42)
    const rng2 = createRng(42)
    const r1 = search(player, world1, rng1)
    const r2 = search(player, world2, rng2)
    expect(r1.foundPath).toBe(r2.foundPath)
    expect(r1.direction).toBe(r2.direction)
  })
})
