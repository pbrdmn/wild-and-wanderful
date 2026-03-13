import { create } from 'zustand'
import type { GameState, Player, World, GamePhase, ActiveEnemy } from '../engine/types'
import { DEFAULT_MAX_AP, Direction, DIRECTION_OFFSETS } from '../engine/types'
import { generateWorld, findStartingPosition } from '../engine/world'
import { movePlayer as engineMovePlayer, endTurn as engineEndTurn, getAdjacentTiles, canMoveTo } from '../engine/movement'
import type { AdjacentTile } from '../engine/movement'
import { rest as engineRest } from '../engine/rest'
import { search as engineSearch } from '../engine/search'
import { getTileDescription, getPeripheralGlimpse } from '../engine/biomes'
import { createRng } from '../engine/random'

export type ViewMode = 'scene' | 'map'

interface GameActions {
  initGame: (seed?: number) => void
  movePlayer: (x: number, y: number) => boolean
  endTurn: () => void
  setView: (view: ViewMode) => void
  rest: () => void
  search: () => void
}

interface GameDerived {
  currentTileDescription: () => string
  peripheralGlimpses: () => { direction: Direction; text: string }[]
  adjacentTiles: () => AdjacentTile[]
  movableTiles: () => AdjacentTile[]
}

interface GameStore extends GameState, GameActions, GameDerived {
  view: ViewMode
  message: string | null
  gameSeed: number
}

function createInitialPlayer(world: World): Player {
  const start = findStartingPosition(world)
  return {
    x: start.x,
    y: start.y,
    ap: DEFAULT_MAX_AP,
    maxAp: DEFAULT_MAX_AP,
    name: 'Wanderer',
    level: 1,
    wounds: 0,
    maxWounds: 1,
  }
}

let actionRng: () => number = createRng(Date.now())

export const useGameStore = create<GameStore>((set, get) => {
  const defaultSeed = Date.now()
  const defaultWorld = generateWorld(defaultSeed)
  const defaultPlayer = createInitialPlayer(defaultWorld)
  actionRng = createRng(defaultSeed + 1)

  return {
    world: defaultWorld,
    player: defaultPlayer,
    turnNumber: 1,
    gamePhase: 'exploring' as GamePhase,
    activeEnemy: undefined,
    view: 'scene' as ViewMode,
    message: null,
    gameSeed: defaultSeed,

    initGame: (seed?: number) => {
      const actualSeed = seed ?? Date.now()
      const world = generateWorld(actualSeed)
      const player = createInitialPlayer(world)
      actionRng = createRng(actualSeed + 1)
      set({
        world,
        player,
        turnNumber: 1,
        gamePhase: 'exploring',
        activeEnemy: undefined,
        view: 'scene',
        message: 'A new adventure begins...',
        gameSeed: actualSeed,
      })
    },

    movePlayer: (x: number, y: number): boolean => {
      const { player, world } = get()
      const result = engineMovePlayer(player, x, y, world)

      if (!result.success) {
        set({ message: result.reason ?? 'Cannot move there.' })
        return false
      }

      const newTiles = world.tiles.map((row) => row.map((t) => ({ ...t })))
      newTiles[y][x] = result.tile

      set({
        player: result.player,
        world: { ...world, tiles: newTiles },
        message: null,
      })
      return true
    },

    endTurn: () => {
      const { player, turnNumber } = get()
      const result = engineEndTurn(player, turnNumber)
      set({
        player: result.player,
        turnNumber: result.turnNumber,
        message: `Turn ${result.turnNumber} begins.`,
      })
    },

    rest: () => {
      const { player } = get()
      const result = engineRest(player, actionRng)

      if (!result.success) {
        set({ message: result.reason ?? 'Cannot rest right now.' })
        return
      }

      const updates: Partial<GameStore> = {
        player: result.player,
      }

      if (result.ambushed && result.enemy) {
        updates.gamePhase = 'combat'
        updates.activeEnemy = result.enemy
        updates.message = result.woundHealed
          ? `Your wounds mend, but you are ambushed by a ${result.enemy.name}!`
          : `You are ambushed by a ${result.enemy.name}!`
      } else {
        updates.message = result.woundHealed
          ? 'You rest and feel a wound begin to heal.'
          : 'You rest for a moment. Nothing stirs.'
      }

      set(updates)
    },

    search: () => {
      const { player, world } = get()
      const result = engineSearch(player, world, actionRng)

      if (!result.success) {
        set({ message: result.reason ?? 'Cannot search right now.' })
        return
      }

      const dirLabel = result.direction
        ? result.direction.charAt(0).toUpperCase() + result.direction.slice(1)
        : ''

      set({
        player: result.player,
        world: result.world,
        message: result.foundPath
          ? `You discovered a hidden path to the ${dirLabel}!`
          : 'You search carefully but find nothing of note.',
      })
    },

    setView: (view: ViewMode) => {
      set({ view, message: null })
    },

    currentTileDescription: () => {
      const { player, world, turnNumber } = get()
      const tile = world.tiles[player.y][player.x]
      return getTileDescription(tile.terrain, player.x * 31 + player.y * 17 + turnNumber)
    },

    peripheralGlimpses: () => {
      const { player, world } = get()
      const glimpses: { direction: Direction; text: string }[] = []
      for (const dir of Object.values(Direction)) {
        const offset = DIRECTION_OFFSETS[dir]
        const nx = player.x + offset.dx
        const ny = player.y + offset.dy
        if (nx >= 0 && nx < world.width && ny >= 0 && ny < world.height) {
          const tile = world.tiles[ny][nx]
          glimpses.push({
            direction: dir,
            text: getPeripheralGlimpse(tile.terrain, dir, nx * 13 + ny * 7),
          })
        }
      }
      return glimpses
    },

    adjacentTiles: () => {
      const { player, world } = get()
      return getAdjacentTiles(player.x, player.y, world)
    },

    movableTiles: () => {
      const { player, world } = get()
      return getAdjacentTiles(player.x, player.y, world).filter((a) => canMoveTo(a.tile))
    },
  }
})
