import { describe, it, expect } from 'vitest'
import { getAdjacentTiles, canMoveTo, movePlayer, endTurn } from '../../src/engine/movement'
import { generateWorld } from '../../src/engine/world'
import type { Player, Tile } from '../../src/engine/types'
import { TerrainType, DEFAULT_MAX_AP } from '../../src/engine/types'

function makeTile(overrides: Partial<Tile> = {}): Tile {
  return {
    x: 0, y: 0,
    terrain: TerrainType.Meadow,
    isExplored: false,
    hasHiddenPath: false,
    ...overrides,
  }
}

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    x: 5, y: 5,
    ap: DEFAULT_MAX_AP, maxAp: DEFAULT_MAX_AP,
    name: 'Test', level: 1,
    wounds: 0, maxWounds: 1,
    inventory: { items: [], equippedItemId: null, maxSlots: 5 },
    ...overrides,
  }
}

describe('getAdjacentTiles', () => {
  const world = generateWorld(42)

  it('returns 4 adjacent tiles for an interior position', () => {
    const adj = getAdjacentTiles(5, 5, world)
    expect(adj).toHaveLength(4)
  })

  it('returns 2 adjacent tiles for a corner position', () => {
    const adj = getAdjacentTiles(0, 0, world)
    expect(adj).toHaveLength(2)
  })

  it('returns 3 adjacent tiles for an edge position', () => {
    const adj = getAdjacentTiles(0, 5, world)
    expect(adj).toHaveLength(3)
  })

  it('includes the correct directions', () => {
    const adj = getAdjacentTiles(5, 5, world)
    const dirs = adj.map((a) => a.direction).sort()
    expect(dirs).toEqual(['east', 'north', 'south', 'west'])
  })
})

describe('canMoveTo', () => {
  it('allows movement to passable terrain', () => {
    expect(canMoveTo(makeTile({ terrain: TerrainType.Meadow }))).toBe(true)
    expect(canMoveTo(makeTile({ terrain: TerrainType.Forest }))).toBe(true)
    expect(canMoveTo(makeTile({ terrain: TerrainType.Road }))).toBe(true)
    expect(canMoveTo(makeTile({ terrain: TerrainType.Village }))).toBe(true)
    expect(canMoveTo(makeTile({ terrain: TerrainType.River }))).toBe(true)
    expect(canMoveTo(makeTile({ terrain: TerrainType.Lake }))).toBe(true)
  })

  it('blocks movement to impassable terrain', () => {
    expect(canMoveTo(makeTile({ terrain: TerrainType.Mountain }))).toBe(false)
    expect(canMoveTo(makeTile({ terrain: TerrainType.Swamp }))).toBe(false)
    expect(canMoveTo(makeTile({ terrain: TerrainType.Thicket }))).toBe(false)
  })

  it('allows movement through impassable terrain with hidden path', () => {
    expect(canMoveTo(makeTile({ terrain: TerrainType.Mountain, hasHiddenPath: true }))).toBe(true)
    expect(canMoveTo(makeTile({ terrain: TerrainType.Swamp, hasHiddenPath: true }))).toBe(true)
  })
})

describe('movePlayer', () => {
  const world = generateWorld(42)

  it('moves the player to an adjacent passable tile', () => {
    const player = makePlayer({ x: 5, y: 5 })
    // Ensure target is passable
    world.tiles[4][5].terrain = TerrainType.Meadow
    const result = movePlayer(player, 5, 4, world)
    expect(result.success).toBe(true)
    expect(result.player.x).toBe(5)
    expect(result.player.y).toBe(4)
    expect(result.player.ap).toBe(DEFAULT_MAX_AP - 1)
  })

  it('marks the target tile as explored', () => {
    const player = makePlayer({ x: 5, y: 5 })
    world.tiles[4][5].terrain = TerrainType.Meadow
    world.tiles[4][5].isExplored = false
    const result = movePlayer(player, 5, 4, world)
    expect(result.tile.isExplored).toBe(true)
  })

  it('fails when player has no AP', () => {
    const player = makePlayer({ ap: 0 })
    const result = movePlayer(player, 5, 4, world)
    expect(result.success).toBe(false)
    expect(result.reason).toContain('AP')
  })

  it('fails for non-adjacent tiles', () => {
    const player = makePlayer({ x: 5, y: 5 })
    const result = movePlayer(player, 7, 5, world)
    expect(result.success).toBe(false)
    expect(result.reason).toContain('adjacent')
  })

  it('fails for impassable terrain', () => {
    const player = makePlayer({ x: 5, y: 5 })
    world.tiles[4][5].terrain = TerrainType.Mountain
    world.tiles[4][5].hasHiddenPath = false
    const result = movePlayer(player, 5, 4, world)
    expect(result.success).toBe(false)
    expect(result.reason).toContain('impassable')
  })

  it('does not mutate the original player', () => {
    const player = makePlayer({ x: 5, y: 5 })
    world.tiles[6][5].terrain = TerrainType.Meadow
    movePlayer(player, 5, 6, world)
    expect(player.x).toBe(5)
    expect(player.y).toBe(5)
    expect(player.ap).toBe(DEFAULT_MAX_AP)
  })
})

describe('endTurn', () => {
  it('resets AP to maxAp', () => {
    const player = makePlayer({ ap: 0 })
    const result = endTurn(player, 1)
    expect(result.player.ap).toBe(DEFAULT_MAX_AP)
  })

  it('increments the turn number', () => {
    const player = makePlayer()
    const result = endTurn(player, 5)
    expect(result.turnNumber).toBe(6)
  })

  it('does not mutate the original player', () => {
    const player = makePlayer({ ap: 1 })
    endTurn(player, 1)
    expect(player.ap).toBe(1)
  })
})
