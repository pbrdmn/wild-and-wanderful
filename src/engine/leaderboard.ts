import type { Player, LeaderboardEntry } from './types'
import { MAX_LEADERBOARD_ENTRIES } from './types'
import { getEquippedItem } from './inventory'

export function createLeaderboardEntry(
  player: Player,
  combatRounds: number,
  questCompleted: boolean,
): LeaderboardEntry {
  const equipped = getEquippedItem(player)
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: player.name,
    species: player.species,
    level: player.level,
    xp: player.xp,
    combatRounds,
    questCompleted,
    equippedItemName: equipped?.name ?? null,
    date: Date.now(),
  }
}

export function sortLeaderboard(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  return [...entries].sort((a, b) => {
    if (a.questCompleted !== b.questCompleted) return a.questCompleted ? -1 : 1
    if (b.level !== a.level) return b.level - a.level
    return b.xp - a.xp
  })
}

export function addToLeaderboard(
  entries: LeaderboardEntry[],
  newEntry: LeaderboardEntry,
): LeaderboardEntry[] {
  return sortLeaderboard([...entries, newEntry]).slice(0, MAX_LEADERBOARD_ENTRIES)
}
