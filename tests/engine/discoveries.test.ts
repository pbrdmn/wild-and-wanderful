import { describe, it, expect, beforeEach } from 'vitest'
import {
  DISCOVERY_REGISTRY,
  getDiscoveriesForBiome,
  placeDiscoveries,
  getDiscoveryById,
  resolveDiscovery,
  resetDiscoveryItemCounter,
} from '../../src/engine/discoveries'
import { generateWorld } from '../../src/engine/world'
import { TerrainType, DEFAULT_MAX_AP, ItemCategory } from '../../src/engine/types'
import type { Player, Tile } from '../../src/engine/types'
import { createRng } from '../../src/engine/random'

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    x: 0, y: 0,
    ap: DEFAULT_MAX_AP, maxAp: DEFAULT_MAX_AP,
    name: 'Test', species: 'fox', level: 1, xp: 0,
    hp: 0, maxHp: 3,
    inventory: { items: [], equippedItemId: null, maxSlots: 5 },
    unlockedSkillIds: [], activeSkillIds: [], maxActiveSkills: 2,
    ...overrides,
  }
}

describe('discoveries', () => {
  beforeEach(() => {
    resetDiscoveryItemCounter()
  })

  describe('DISCOVERY_REGISTRY', () => {
    it('has at least 10 discoveries', () => {
      expect(DISCOVERY_REGISTRY.length).toBeGreaterThanOrEqual(10)
    })

    it('every discovery has required fields', () => {
      for (const d of DISCOVERY_REGISTRY) {
        expect(d.id).toBeTruthy()
        expect(d.name).toBeTruthy()
        expect(d.description).toBeTruthy()
        expect(['item', 'npc', 'event']).toContain(d.discoveryType)
        expect(d.biomes.length).toBeGreaterThan(0)
        expect(d.effect).toBeDefined()
      }
    })
  })

  describe('getDiscoveriesForBiome', () => {
    it('returns discoveries for forest', () => {
      const results = getDiscoveriesForBiome(TerrainType.Forest)
      expect(results.length).toBeGreaterThan(0)
      results.forEach((d) => expect(d.biomes).toContain(TerrainType.Forest))
    })

    it('returns discoveries for village', () => {
      const results = getDiscoveriesForBiome(TerrainType.Village)
      expect(results.length).toBeGreaterThan(0)
    })
  })

  describe('placeDiscoveries', () => {
    it('places discoveries on some tiles', () => {
      const world = generateWorld(42)
      const rng = createRng(99)
      const tiles = world.tiles.map((row) => row.map((t) => ({ ...t, discoveryId: undefined, enemyId: undefined })))
      placeDiscoveries(tiles, world.width, world.height, rng)
      const discoveryCount = tiles.flat().filter((t) => t.discoveryId != null).length
      expect(discoveryCount).toBeGreaterThan(0)
    })

    it('does not place discoveries on tiles with enemies', () => {
      const tiles: Tile[][] = [[
        { x: 0, y: 0, terrain: TerrainType.Forest, isExplored: false, hasHiddenPath: false, enemyId: 'shadow-wolf' },
      ]]
      const rng = createRng(1)
      placeDiscoveries(tiles, 1, 1, rng)
      expect(tiles[0][0].discoveryId).toBeUndefined()
    })
  })

  describe('getDiscoveryById', () => {
    it('returns a discovery by its id', () => {
      const d = getDiscoveryById('mushroom-patch')
      expect(d).toBeDefined()
      expect(d!.name).toBe('Mushroom Patch')
    })

    it('returns undefined for unknown id', () => {
      expect(getDiscoveryById('nonexistent')).toBeUndefined()
    })
  })

  describe('resolveDiscovery', () => {
    it('returns null for unknown discovery', () => {
      const result = resolveDiscovery(makePlayer(), 'nonexistent')
      expect(result).toBeNull()
    })

    it('heals wounds for heal effect', () => {
      const player = makePlayer({ hp: 2 })
      const result = resolveDiscovery(player, 'mushroom-patch')
      expect(result).not.toBeNull()
      expect(result!.player.hp).toBe(3)
      expect(result!.message).toContain('Healed')
    })

    it('does not heal below 0 wounds', () => {
      const player = makePlayer({ hp: 3 })
      const result = resolveDiscovery(player, 'mushroom-patch')
      expect(result).not.toBeNull()
      expect(result!.player.hp).toBe(3)
    })

    it('grants XP for xp effect', () => {
      const player = makePlayer({ xp: 5 })
      const result = resolveDiscovery(player, 'owl-sage')
      expect(result).not.toBeNull()
      expect(result!.player.xp).toBe(7)
      expect(result!.message).toContain('+2 XP')
    })

    it('adds item to inventory for item effect', () => {
      const player = makePlayer()
      const result = resolveDiscovery(player, 'sunlit-cache')
      expect(result).not.toBeNull()
      expect(result!.player.inventory.items).toHaveLength(1)
      expect(result!.player.inventory.items[0].name).toBe('Rough-Hewn Club')
      expect(result!.message).toContain('Found')
    })

    it('does not add item when inventory is full', () => {
      const fullItems = Array.from({ length: 5 }, (_, i) => ({
        id: `item-${i}`,
        name: `Item ${i}`,
        category: ItemCategory.Melee,
        description: '',
        attackPower: 1,
        flavourText: '',
        maxUses: 10,
        currentUses: 10,
        isConsumable: true,
      }))
      const player = makePlayer({
        inventory: { items: fullItems, equippedItemId: null, maxSlots: 5 },
      })
      const result = resolveDiscovery(player, 'sunlit-cache')
      expect(result).not.toBeNull()
      expect(result!.player.inventory.items).toHaveLength(5)
      expect(result!.message).toContain('pack is full')
    })

    it('returns narrative message for narrative effect', () => {
      const result = resolveDiscovery(makePlayer(), 'travelling-merchant')
      expect(result).not.toBeNull()
      expect(result!.message).toContain('hedgehog merchant')
    })
  })
})
