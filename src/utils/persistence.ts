import { get, set, del } from 'idb-keyval'
import type { GameState, Item } from '../engine/types'

const SAVE_KEY = 'game-save'

export const CURRENT_SAVE_VERSION = 2

export interface SaveData {
  world: GameState['world']
  player: GameState['player']
  turnNumber: number
  gamePhase: GameState['gamePhase']
  activeEnemy: GameState['activeEnemy']
  gameSeed: number
  offeredItems?: Item[]
  saveVersion?: number
}

// Each migration transforms save data from version N to N+1.
// Keys are the source version (the version being migrated FROM).
const migrations: Record<number, (data: any) => any> = {
  1: (data) => {
    // Phase 3: backfill player.inventory for pre-Phase-3 saves
    if (!data.player.inventory) {
      data.player.inventory = { items: [], equippedItemId: null, maxSlots: 5 }
    }
    return data
  },
}

export function migrateSaveData(raw: any): SaveData | null {
  let version = raw.saveVersion ?? 1

  if (version > CURRENT_SAVE_VERSION) {
    return null
  }

  let data = { ...raw }
  while (version < CURRENT_SAVE_VERSION) {
    const migrate = migrations[version]
    if (!migrate) {
      return null
    }
    data = migrate(data)
    version++
  }
  data.saveVersion = CURRENT_SAVE_VERSION
  return data as SaveData
}

export async function saveGame(data: SaveData): Promise<void> {
  await set(SAVE_KEY, { ...data, saveVersion: CURRENT_SAVE_VERSION })
}

export async function loadGame(): Promise<SaveData | null> {
  const raw = await get<any>(SAVE_KEY)
  if (!raw) return null
  return migrateSaveData(raw)
}

export async function clearSave(): Promise<void> {
  await del(SAVE_KEY)
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null

export function debouncedSave(data: SaveData, delayMs = 500): void {
  if (debounceTimer !== null) {
    clearTimeout(debounceTimer)
  }
  debounceTimer = setTimeout(() => {
    saveGame(data)
    debounceTimer = null
  }, delayMs)
}
