import { get, set, del } from 'idb-keyval'
import type { GameState } from '../engine/types'

const SAVE_KEY = 'game-save'

export interface SaveData {
  world: GameState['world']
  player: GameState['player']
  turnNumber: number
  gamePhase: GameState['gamePhase']
  activeEnemy: GameState['activeEnemy']
  gameSeed: number
}

export async function saveGame(data: SaveData): Promise<void> {
  await set(SAVE_KEY, data)
}

export async function loadGame(): Promise<SaveData | null> {
  const data = await get<SaveData>(SAVE_KEY)
  return data ?? null
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
