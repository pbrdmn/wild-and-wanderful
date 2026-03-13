import type { Tile, Player, World } from './types'
import { Direction, DIRECTION_OFFSETS, IMPASSABLE_TERRAIN } from './types'

export interface AdjacentTile {
  tile: Tile
  direction: Direction
}

export function getAdjacentTiles(x: number, y: number, world: World): AdjacentTile[] {
  const result: AdjacentTile[] = []
  for (const dir of Object.values(Direction)) {
    const offset = DIRECTION_OFFSETS[dir]
    const nx = x + offset.dx
    const ny = y + offset.dy
    if (nx >= 0 && nx < world.width && ny >= 0 && ny < world.height) {
      result.push({ tile: world.tiles[ny][nx], direction: dir })
    }
  }
  return result
}

export function canMoveTo(tile: Tile): boolean {
  if (tile.hasHiddenPath) return true
  return !IMPASSABLE_TERRAIN.has(tile.terrain)
}

export interface MoveResult {
  success: boolean
  reason?: string
  player: Player
  tile: Tile
}

export function movePlayer(
  player: Player,
  targetX: number,
  targetY: number,
  world: World,
): MoveResult {
  const targetTile = world.tiles[targetY][targetX]

  const dx = Math.abs(targetX - player.x)
  const dy = Math.abs(targetY - player.y)
  const isAdjacent = (dx + dy) === 1
  if (!isAdjacent) {
    return { success: false, reason: 'Can only move to adjacent tiles.', player, tile: targetTile }
  }

  if (!canMoveTo(targetTile)) {
    return { success: false, reason: 'This terrain is impassable.', player, tile: targetTile }
  }

  const updatedTile: Tile = { ...targetTile, isExplored: true }
  const updatedPlayer: Player = {
    ...player,
    x: targetX,
    y: targetY,
  }

  return { success: true, player: updatedPlayer, tile: updatedTile }
}

export function endTurn(player: Player, combatRounds: number): { player: Player; combatRounds: number } {
  return {
    player: { ...player, ap: player.maxAp },
    combatRounds: combatRounds + 1,
  }
}
