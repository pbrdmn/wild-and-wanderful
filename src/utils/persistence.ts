import { get, set, del } from 'idb-keyval'
import type { GameState, Item, LeaderboardEntry } from '../engine/types'

const SAVE_KEY = 'game-save'
const LEADERBOARD_KEY = 'leaderboard'

export const CURRENT_SAVE_VERSION = 5

export interface SaveData {
  world: GameState['world']
  player: GameState['player']
  combatRounds: number
  gamePhase: GameState['gamePhase']
  activeEnemy: GameState['activeEnemy']
  gameSeed: number
  offeredItems?: Item[]
  saveVersion?: number
}

// Each migration transforms save data from version N to N+1.
// Keys are the source version (the version being migrated FROM).
const migrations: Record<number, (data: SaveData) => SaveData> = {
  1: (data) => {
    // Phase 3: backfill player.inventory for pre-Phase-3 saves
    if (!data.player.inventory) {
      data.player.inventory = { items: [], equippedItemId: null, maxSlots: 5 }
    }
    return data
  },
  2: (data) => {
    // Phase 4: backfill player skill fields and ActiveEnemy combat fields
    if (!data.player.unlockedSkillIds) data.player.unlockedSkillIds = []
    if (!data.player.activeSkillIds) data.player.activeSkillIds = []
    if (data.player.maxActiveSkills === undefined) data.player.maxActiveSkills = 2
    if (data.activeEnemy) {
      if (data.activeEnemy.hp === undefined) data.activeEnemy.hp = data.activeEnemy.strength
      if (data.activeEnemy.maxHp === undefined) data.activeEnemy.maxHp = data.activeEnemy.strength
      if (!data.activeEnemy.statusEffects) data.activeEnemy.statusEffects = []
    }
    return data
  },
  3: (data) => {
    if (!data.player.species) data.player.species = 'fox'
    if (data.player.xp === undefined) data.player.xp = 0
    return data
  },
  4: (data) => {
    if ('turnNumber' in data) {
      const turnNumber = (data as { turnNumber?: number }).turnNumber
      data.combatRounds = turnNumber ?? 0
      delete (data as { turnNumber?: number }).turnNumber
    }
    return data
  },
}

export function migrateSaveData(raw: SaveData | Record<string, unknown>): SaveData | null {
  let version = (raw as { saveVersion?: number }).saveVersion
  if (version === undefined) version = 1

  if (version > CURRENT_SAVE_VERSION) {
    return null
  }

  let data = { ...raw } as SaveData
  while (version < CURRENT_SAVE_VERSION) {
    const migrate = migrations[version]
    if (!migrate) {
      return null
    }
    data = migrate(data)
    version++
  }
  data.saveVersion = CURRENT_SAVE_VERSION
  return data
}

export async function saveGame(data: SaveData): Promise<void> {
  await set(SAVE_KEY, { ...data, saveVersion: CURRENT_SAVE_VERSION })
}

export async function loadGame(): Promise<SaveData | null> {
  try {
    const raw = await get<SaveData>(SAVE_KEY)
    if (!raw) return null
    return migrateSaveData(raw)
  } catch {
    return null
  }
}

export async function saveLeaderboard(entries: LeaderboardEntry[]): Promise<void> {
  await set(LEADERBOARD_KEY, entries)
}

export async function loadLeaderboard(): Promise<LeaderboardEntry[]> {
  const raw = await get<LeaderboardEntry[]>(LEADERBOARD_KEY)
  return raw ?? []
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
