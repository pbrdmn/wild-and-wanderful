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
      name: 'Tester', level: 1,
      wounds: 0, maxWounds: 1,
    },
    turnNumber: 5,
    gamePhase: 'exploring',
    activeEnemy: undefined,
    gameSeed: 12345,
  }
}

describe('persistence', () => {
  let saveGame: typeof import('../../src/utils/persistence').saveGame
  let loadGame: typeof import('../../src/utils/persistence').loadGame
  let clearSave: typeof import('../../src/utils/persistence').clearSave
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
  })

  it('saves and loads game data round-trip', async () => {
    const data = makeSaveData()
    await saveGame(data)
    const loaded = await loadGame()
    expect(loaded).not.toBeNull()
    expect(loaded!.turnNumber).toBe(5)
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
    data.activeEnemy = { name: 'Shadow Wolf', strength: 1, hasInitiative: true }
    await saveGame(data)
    const loaded = await loadGame()
    expect(loaded!.activeEnemy).toEqual({ name: 'Shadow Wolf', strength: 1, hasInitiative: true })
  })
})
