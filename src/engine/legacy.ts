import type { LeaderboardEntry, LegacyNpc, Tile } from './types'
import { TerrainType, IMPASSABLE_TERRAIN } from './types'

export function selectLegacyNpcs(
  leaderboard: LeaderboardEntry[],
  rng: () => number,
  count = 3,
): LegacyNpc[] {
  const pool = [...leaderboard]
  const selected: LegacyNpc[] = []
  const pick = Math.min(count, pool.length)

  for (let i = 0; i < pick; i++) {
    const idx = Math.floor(rng() * pool.length)
    const entry = pool.splice(idx, 1)[0]
    selected.push({
      name: entry.name,
      species: entry.species,
      level: entry.level,
      questCompleted: entry.questCompleted,
      tileX: 0,
      tileY: 0,
    })
  }
  return selected
}

export function placeLegacyNpcs(
  tiles: Tile[][],
  width: number,
  height: number,
  npcs: LegacyNpc[],
  rng: () => number,
): void {
  for (const npc of npcs) {
    let placed = false
    for (let attempts = 0; attempts < 50 && !placed; attempts++) {
      const x = Math.floor(rng() * width)
      const y = Math.floor(rng() * height)
      const tile = tiles[y][x]
      if (
        !IMPASSABLE_TERRAIN.has(tile.terrain) &&
        tile.terrain !== TerrainType.Village &&
        !tile.enemyId &&
        !tile.legacyNpc
      ) {
        npc.tileX = x
        npc.tileY = y
        tile.legacyNpc = npc
        placed = true
      }
    }
  }
}
