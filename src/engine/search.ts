import type { Player, World, Direction, Tile } from './types'
import { SEARCH_REVEAL_CHANCE, IMPASSABLE_TERRAIN, DIRECTION_OFFSETS } from './types'
import { Direction as Dir } from './types'

export interface SearchResult {
  success: boolean
  reason?: string
  player: Player
  world: World
  foundPath: boolean
  direction?: Direction
}

function getAdjacentImpassable(
  x: number,
  y: number,
  world: World,
): { tile: Tile; direction: Direction }[] {
  const results: { tile: Tile; direction: Direction }[] = []
  for (const dir of Object.values(Dir)) {
    const offset = DIRECTION_OFFSETS[dir]
    const nx = x + offset.dx
    const ny = y + offset.dy
    if (nx >= 0 && nx < world.width && ny >= 0 && ny < world.height) {
      const tile = world.tiles[ny][nx]
      if (IMPASSABLE_TERRAIN.has(tile.terrain) && !tile.hasHiddenPath) {
        results.push({ tile, direction: dir })
      }
    }
  }
  return results
}

export function search(
  player: Player,
  world: World,
  rng: () => number,
): SearchResult {
  const updatedPlayer: Player = { ...player }

  const candidates = getAdjacentImpassable(player.x, player.y, world)
  if (candidates.length === 0) {
    return {
      success: true,
      player: updatedPlayer,
      world,
      foundPath: false,
    }
  }

  const revealRoll = rng()
  if (revealRoll >= SEARCH_REVEAL_CHANCE) {
    return {
      success: true,
      player: updatedPlayer,
      world,
      foundPath: false,
    }
  }

  const pick = candidates[Math.floor(rng() * candidates.length)]
  const newTiles = world.tiles.map((row) => row.map((t) => ({ ...t })))
  newTiles[pick.tile.y][pick.tile.x] = { ...pick.tile, hasHiddenPath: true }

  return {
    success: true,
    player: updatedPlayer,
    world: { ...world, tiles: newTiles },
    foundPath: true,
    direction: pick.direction,
  }
}
