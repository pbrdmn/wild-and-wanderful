import { describe, it, expect } from 'vitest'
import { generateWorld, findStartingPosition } from '../../src/engine/world'
import { TerrainType, IMPASSABLE_TERRAIN, DEFAULT_WORLD_SIZE } from '../../src/engine/types'

describe('generateWorld', () => {
  const seed = 42
  const world = generateWorld(seed)

  it('creates a grid of the correct dimensions', () => {
    expect(world.width).toBe(DEFAULT_WORLD_SIZE)
    expect(world.height).toBe(DEFAULT_WORLD_SIZE)
    expect(world.tiles.length).toBe(DEFAULT_WORLD_SIZE)
    world.tiles.forEach((row) => {
      expect(row.length).toBe(DEFAULT_WORLD_SIZE)
    })
  })

  it('places at least one village tile', () => {
    const villages = world.tiles.flat().filter((t) => t.terrain === TerrainType.Village)
    expect(villages.length).toBeGreaterThanOrEqual(1)
  })

  it('has a quest marker within bounds', () => {
    expect(world.questMarker.x).toBeGreaterThanOrEqual(0)
    expect(world.questMarker.x).toBeLessThan(world.width)
    expect(world.questMarker.y).toBeGreaterThanOrEqual(0)
    expect(world.questMarker.y).toBeLessThan(world.height)
  })

  it('marks the starting village tile as explored', () => {
    const start = findStartingPosition(world)
    const tile = world.tiles[start.y][start.x]
    expect(tile.isExplored).toBe(true)
    expect(tile.terrain).toBe(TerrainType.Village)
  })

  it('marks tiles adjacent to start as explored', () => {
    const start = findStartingPosition(world)
    const offsets = [[0, -1], [1, 0], [0, 1], [-1, 0]] as const
    for (const [dx, dy] of offsets) {
      const nx = start.x + dx
      const ny = start.y + dy
      if (nx >= 0 && nx < world.width && ny >= 0 && ny < world.height) {
        expect(world.tiles[ny][nx].isExplored).toBe(true)
      }
    }
  })

  it('does not have impassable terrain directly adjacent to start', () => {
    const start = findStartingPosition(world)
    const offsets = [[0, -1], [1, 0], [0, 1], [-1, 0]] as const
    for (const [dx, dy] of offsets) {
      const nx = start.x + dx
      const ny = start.y + dy
      if (nx >= 0 && nx < world.width && ny >= 0 && ny < world.height) {
        const tile = world.tiles[ny][nx]
        expect(IMPASSABLE_TERRAIN.has(tile.terrain)).toBe(false)
      }
    }
  })

  it('generates a variety of terrain types', () => {
    const terrainSet = new Set(world.tiles.flat().map((t) => t.terrain))
    expect(terrainSet.size).toBeGreaterThanOrEqual(4)
  })

  it('produces deterministic output for the same seed', () => {
    const world2 = generateWorld(seed)
    expect(world.tiles.flat().map((t) => t.terrain)).toEqual(
      world2.tiles.flat().map((t) => t.terrain),
    )
    expect(world.questMarker).toEqual(world2.questMarker)
  })

  it('produces different output for different seeds', () => {
    const world2 = generateWorld(seed + 1)
    const terrains1 = world.tiles.flat().map((t) => t.terrain)
    const terrains2 = world2.tiles.flat().map((t) => t.terrain)
    expect(terrains1).not.toEqual(terrains2)
  })

  it('supports custom grid sizes', () => {
    const small = generateWorld(seed, 10)
    expect(small.width).toBe(10)
    expect(small.height).toBe(10)
    expect(small.tiles.length).toBe(10)
  })

  it('places river tiles', () => {
    const rivers = world.tiles.flat().filter((t) => t.terrain === TerrainType.River)
    expect(rivers.length).toBeGreaterThan(0)
  })

  it('sets all tile coordinates correctly', () => {
    for (let y = 0; y < world.height; y++) {
      for (let x = 0; x < world.width; x++) {
        expect(world.tiles[y][x].x).toBe(x)
        expect(world.tiles[y][x].y).toBe(y)
      }
    }
  })
})
