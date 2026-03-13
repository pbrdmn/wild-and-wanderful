import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { SaveData } from '../../src/utils/persistence'
import { TerrainType, DEFAULT_MAX_AP } from '../../src/engine/types'

vi.mock('idb-keyval', () => {
  const store = new Map<string, unknown>()
  return {
    get: vi.fn((key: string) => Promise.resolve(store.get(key))),
    set: vi.fn((key: string, value: unknown) => {
      store.set(key, value)
      return Promise.resolve()
    }),
    del: vi.fn((key: string) => {
      store.delete(key)
      return Promise.resolve()
    }),
    _store: store,
  }
})

function makeSaveData(): SaveData {
  return {
    world: {
      width: 3,
      height: 3,
      tiles: Array.from({ length: 3 }, (_, y) =>
        Array.from({ length: 3 }, (_, x) => ({
          x, y,
          terrain: TerrainType.Meadow,
          isExplored: false,
          hasHiddenPath: false,
        })),
      ),
      questMarker: { x: 2, y: 0 },
    },
    player: {
      x: 1, y: 1,
      ap: DEFAULT_MAX_AP, maxAp: DEFAULT_MAX_AP,
      name: 'Tester', species: 'fox', level: 1, xp: 0,
      wounds: 0, maxWounds: 1,
      inventory: { items: [], equippedItemId: null, maxSlots: 5 },
      unlockedSkillIds: [], activeSkillIds: [], maxActiveSkills: 2,
    },
    combatRounds: 5,
    gamePhase: 'exploring',
    activeEnemy: undefined,
    gameSeed: 12345,
  }
}

function makeV1SaveData(): Record<string, unknown> {
  return {
    world: {
      width: 3,
      height: 3,
      tiles: Array.from({ length: 3 }, (_, y) =>
        Array.from({ length: 3 }, (_, x) => ({
          x, y,
          terrain: TerrainType.Meadow,
          isExplored: false,
          hasHiddenPath: false,
        })),
      ),
      questMarker: { x: 2, y: 0 },
    },
    player: {
      x: 1, y: 1,
      ap: DEFAULT_MAX_AP, maxAp: DEFAULT_MAX_AP,
      name: 'OldSave', level: 1,
      wounds: 0, maxWounds: 1,
    },
    turnNumber: 3,
    gamePhase: 'exploring',
    activeEnemy: undefined,
    gameSeed: 99999,
  }
}

describe('persistence', () => {
  let saveGame: typeof import('../../src/utils/persistence').saveGame
  let loadGame: typeof import('../../src/utils/persistence').loadGame
  let clearSave: typeof import('../../src/utils/persistence').clearSave
  let migrateSaveData: typeof import('../../src/utils/persistence').migrateSaveData
  let CURRENT_SAVE_VERSION: number
  let mockStore: Map<string, unknown>

  beforeEach(async () => {
    const idbMock = await import('idb-keyval') as unknown as {
      _store: Map<string, unknown>
      get: ReturnType<typeof vi.fn>
      set: ReturnType<typeof vi.fn>
      del: ReturnType<typeof vi.fn>
    }
    mockStore = idbMock._store
    mockStore.clear()

    const mod = await import('../../src/utils/persistence')
    saveGame = mod.saveGame
    loadGame = mod.loadGame
    clearSave = mod.clearSave
    migrateSaveData = mod.migrateSaveData
    CURRENT_SAVE_VERSION = mod.CURRENT_SAVE_VERSION
  })

  it('saves and loads game data round-trip', async () => {
    const data = makeSaveData()
    await saveGame(data)
    const loaded = await loadGame()
    expect(loaded).not.toBeNull()
    expect(loaded!.combatRounds).toBe(5)
    expect(loaded!.player.name).toBe('Tester')
    expect(loaded!.gameSeed).toBe(12345)
  })

  it('returns null when no save exists', async () => {
    const loaded = await loadGame()
    expect(loaded).toBeNull()
  })

  it('clears saved data', async () => {
    await saveGame(makeSaveData())
    await clearSave()
    const loaded = await loadGame()
    expect(loaded).toBeNull()
  })

  it('preserves activeEnemy through save/load', async () => {
    const data = makeSaveData()
    data.activeEnemy = { name: 'Shadow Wolf', strength: 1, hp: 2, maxHp: 2, hasInitiative: true, statusEffects: [] }
    await saveGame(data)
    const loaded = await loadGame()
    expect(loaded!.activeEnemy).toEqual({ name: 'Shadow Wolf', strength: 1, hp: 2, maxHp: 2, hasInitiative: true, statusEffects: [] })
  })

  describe('version stamping', () => {
    it('stamps saveVersion on every save', async () => {
      await saveGame(makeSaveData())
      const raw = mockStore.get('game-save') as any
      expect(raw.saveVersion).toBe(CURRENT_SAVE_VERSION)
    })

    it('round-tripped data retains saveVersion', async () => {
      await saveGame(makeSaveData())
      const loaded = await loadGame()
      expect(loaded!.saveVersion).toBe(CURRENT_SAVE_VERSION)
    })
  })

  describe('migrateSaveData', () => {
    it('migrates a v1 save (no saveVersion, no inventory) to current version', () => {
      const v1 = makeV1SaveData()
      const result = migrateSaveData(v1)
      expect(result).not.toBeNull()
      expect(result!.saveVersion).toBe(CURRENT_SAVE_VERSION)
      expect(result!.player.inventory).toEqual({
        items: [],
        equippedItemId: null,
        maxSlots: 5,
      })
      expect(result!.player.name).toBe('OldSave')
    })

    it('returns null for a save with version newer than current', () => {
      const futureSave = { ...makeSaveData(), saveVersion: CURRENT_SAVE_VERSION + 1 }
      const result = migrateSaveData(futureSave)
      expect(result).toBeNull()
    })

    it('does not modify a current-version save', () => {
      const data = { ...makeSaveData(), saveVersion: CURRENT_SAVE_VERSION }
      const result = migrateSaveData(data)
      expect(result).not.toBeNull()
      expect(result!.saveVersion).toBe(CURRENT_SAVE_VERSION)
      expect(result!.player.name).toBe('Tester')
    })

    it('treats missing saveVersion as version 1', () => {
      const v1 = makeV1SaveData()
      delete (v1 as any).saveVersion
      const result = migrateSaveData(v1)
      expect(result).not.toBeNull()
      expect(result!.saveVersion).toBe(CURRENT_SAVE_VERSION)
    })

    it('migrates a v1 save through all migrations including v3->v4 (species, xp)', () => {
      const v1 = makeV1SaveData()
      const result = migrateSaveData(v1)
      expect(result).not.toBeNull()
      expect(result!.player.species).toBe('fox')
      expect(result!.player.xp).toBe(0)
    })

    it('migrates a v3 save to v4 (backfills species and xp)', () => {
      const v3: Record<string, unknown> = {
        ...makeSaveData(),
        saveVersion: 3,
      }
      delete (v3 as any).player.species
      delete (v3 as any).player.xp
      ;(v3 as any).turnNumber = (v3 as any).combatRounds
      delete (v3 as any).combatRounds
      const result = migrateSaveData(v3)
      expect(result).not.toBeNull()
      expect(result!.saveVersion).toBe(CURRENT_SAVE_VERSION)
      expect(result!.player.species).toBe('fox')
      expect(result!.player.xp).toBe(0)
    })

    it('migrates a v4 save to v5 (turnNumber to combatRounds)', () => {
      const v4: Record<string, unknown> = {
        ...makeSaveData(),
        saveVersion: 4,
      }
      ;(v4 as any).turnNumber = (v4 as any).combatRounds
      delete (v4 as any).combatRounds
      const result = migrateSaveData(v4)
      expect(result).not.toBeNull()
      expect(result!.saveVersion).toBe(CURRENT_SAVE_VERSION)
      expect(result!.combatRounds).toBe(5)
      expect((result as any).turnNumber).toBeUndefined()
    })
  })

  describe('loadGame with migrations', () => {
    it('migrates a v1 save stored in IndexedDB', async () => {
      mockStore.set('game-save', makeV1SaveData())
      const loaded = await loadGame()
      expect(loaded).not.toBeNull()
      expect(loaded!.player.inventory).toBeDefined()
      expect(loaded!.saveVersion).toBe(CURRENT_SAVE_VERSION)
    })

    it('returns null for a future-version save in IndexedDB', async () => {
      mockStore.set('game-save', { ...makeSaveData(), saveVersion: 999 })
      const loaded = await loadGame()
      expect(loaded).toBeNull()
    })
  })
})
