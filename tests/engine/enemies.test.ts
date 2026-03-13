import { describe, it, expect } from 'vitest'
import {
  ENEMY_REGISTRY,
  getEnemiesForBiome,
  createActiveEnemy,
  placeEnemies,
  getEnemyById,
  checkTileEncounter,
} from '../../src/engine/enemies'
import type { Tile } from '../../src/engine/types'
import { TerrainType } from '../../src/engine/types'
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

describe('ENEMY_REGISTRY', () => {
  it('contains 8 enemy templates', () => {
    expect(ENEMY_REGISTRY).toHaveLength(8)
  })

  it('every template has a unique id', () => {
    const ids = ENEMY_REGISTRY.map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every template has positive strength and hp', () => {
    for (const enemy of ENEMY_REGISTRY) {
      expect(enemy.strength).toBeGreaterThan(0)
      expect(enemy.hp).toBeGreaterThan(0)
    }
  })
})

describe('getEnemiesForBiome', () => {
  it('returns forest enemies for forest terrain', () => {
    const enemies = getEnemiesForBiome(TerrainType.Forest)
    expect(enemies.length).toBeGreaterThan(0)
    expect(enemies.some((e) => e.name === 'Shadow Wolf')).toBe(true)
  })

  it('returns empty for village terrain', () => {
    const enemies = getEnemiesForBiome(TerrainType.Village)
    expect(enemies).toHaveLength(0)
  })

  it('returns enemies for road terrain', () => {
    const enemies = getEnemiesForBiome(TerrainType.Road)
    expect(enemies.some((e) => e.name === 'Highwayman Fox')).toBe(true)
  })
})

describe('getEnemyById', () => {
  it('finds an enemy by id', () => {
    const enemy = getEnemyById('shadow-wolf')
    expect(enemy).toBeDefined()
    expect(enemy!.name).toBe('Shadow Wolf')
  })

  it('returns undefined for unknown id', () => {
    expect(getEnemyById('nonexistent')).toBeUndefined()
  })
})

describe('createActiveEnemy', () => {
  it('creates an active enemy from a template', () => {
    const template = ENEMY_REGISTRY[0]
    const active = createActiveEnemy(template, false)
    expect(active.name).toBe(template.name)
    expect(active.strength).toBe(template.strength)
    expect(active.hp).toBe(template.hp)
    expect(active.maxHp).toBe(template.hp)
    expect(active.hasInitiative).toBe(false)
    expect(active.statusEffects).toEqual([])
  })

  it('sets hasInitiative when specified', () => {
    const template = ENEMY_REGISTRY[0]
    const active = createActiveEnemy(template, true)
    expect(active.hasInitiative).toBe(true)
  })
})

describe('placeEnemies', () => {
  it('places enemies on some tiles', () => {
    const tiles: Tile[][] = Array.from({ length: 5 }, (_, y) =>
      Array.from({ length: 5 }, (_, x) => makeTile(x, y, { terrain: TerrainType.Forest })),
    )
    const rng = createRng(42)
    placeEnemies(tiles, 5, 5, rng)
    const withEnemy = tiles.flat().filter((t) => t.enemyId !== undefined)
    expect(withEnemy.length).toBeGreaterThan(0)
  })

  it('does not place enemies on village tiles', () => {
    const tiles: Tile[][] = Array.from({ length: 3 }, (_, y) =>
      Array.from({ length: 3 }, (_, x) => makeTile(x, y, { terrain: TerrainType.Village })),
    )
    const rng = createRng(42)
    placeEnemies(tiles, 3, 3, rng)
    const withEnemy = tiles.flat().filter((t) => t.enemyId !== undefined)
    expect(withEnemy).toHaveLength(0)
  })

  it('does not place enemies on lake tiles', () => {
    const tiles: Tile[][] = Array.from({ length: 3 }, (_, y) =>
      Array.from({ length: 3 }, (_, x) => makeTile(x, y, { terrain: TerrainType.Lake })),
    )
    const rng = createRng(42)
    placeEnemies(tiles, 3, 3, rng)
    const withEnemy = tiles.flat().filter((t) => t.enemyId !== undefined)
    expect(withEnemy).toHaveLength(0)
  })

  it('produces deterministic results with seeded RNG', () => {
    const make = () =>
      Array.from({ length: 5 }, (_, y) =>
        Array.from({ length: 5 }, (_, x) => makeTile(x, y, { terrain: TerrainType.Forest })),
      )
    const tiles1 = make()
    const tiles2 = make()
    placeEnemies(tiles1, 5, 5, createRng(99))
    placeEnemies(tiles2, 5, 5, createRng(99))
    const ids1 = tiles1.flat().map((t) => t.enemyId)
    const ids2 = tiles2.flat().map((t) => t.enemyId)
    expect(ids1).toEqual(ids2)
  })
})

describe('checkTileEncounter', () => {
  it('returns an active enemy when tile has an enemyId', () => {
    const tile = makeTile(0, 0, { enemyId: 'shadow-wolf' })
    const rng = createRng(42)
    const enemy = checkTileEncounter(tile, rng)
    expect(enemy).not.toBeNull()
    expect(enemy!.name).toBe('Shadow Wolf')
  })

  it('returns null when tile has no enemyId', () => {
    const tile = makeTile(0, 0)
    const rng = createRng(42)
    expect(checkTileEncounter(tile, rng)).toBeNull()
  })

  it('returns null for unknown enemyId', () => {
    const tile = makeTile(0, 0, { enemyId: 'nonexistent' })
    const rng = createRng(42)
    expect(checkTileEncounter(tile, rng)).toBeNull()
  })
})
