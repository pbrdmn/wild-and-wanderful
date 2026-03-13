import { create } from 'zustand'
import type { GameState, Player, World, GamePhase, ActiveEnemy, Item } from '../engine/types'
import { DEFAULT_MAX_AP, Direction, DIRECTION_OFFSETS } from '../engine/types'
import { generateWorld, findStartingPosition } from '../engine/world'
import { movePlayer as engineMovePlayer, endTurn as engineEndTurn, getAdjacentTiles, canMoveTo } from '../engine/movement'
import type { AdjacentTile } from '../engine/movement'
import { rest as engineRest } from '../engine/rest'
import { search as engineSearch } from '../engine/search'
import { generateHeirloomChoices } from '../engine/items'
import {
  addItem as engineAddItem,
  equipItem as engineEquipItem,
  unequipItem as engineUnequipItem,
  swapEquipment as engineSwapEquipment,
  getEquippedItem,
} from '../engine/inventory'
import { getTileDescription, getPeripheralGlimpse } from '../engine/biomes'
import { createRng } from '../engine/random'
import { debouncedSave, loadGame, clearSave } from '../utils/persistence'
import type { SaveData } from '../utils/persistence'

export type ViewMode = 'scene' | 'map' | 'inventory' | 'intro'

interface GameActions {
  initGame: (seed?: number) => void
  loadSavedGame: () => Promise<boolean>
  newGame: (seed?: number) => void
  movePlayer: (x: number, y: number) => boolean
  endTurn: () => void
  setView: (view: ViewMode) => void
  rest: () => void
  search: () => void
  selectItem: (itemId: string) => void
  equipItem: (itemId: string) => void
  unequipItem: () => void
  swapEquipment: (itemId: string) => void
}

interface GameDerived {
  currentTileDescription: () => string
  peripheralGlimpses: () => { direction: Direction; text: string }[]
  adjacentTiles: () => AdjacentTile[]
  movableTiles: () => AdjacentTile[]
  equippedItem: () => Item | null
}

interface GameStore extends GameState, GameActions, GameDerived {
  view: ViewMode
  message: string | null
  gameSeed: number
  loaded: boolean
  offeredItems: Item[]
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
    inventory: { items: [], equippedItemId: null, maxSlots: 5 },
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
    gamePhase: 'intro' as GamePhase,
    activeEnemy: undefined,
    view: 'intro' as ViewMode,
    message: null,
    gameSeed: defaultSeed,
    loaded: false,
    offeredItems: [],

    initGame: (seed?: number) => {
      const actualSeed = seed ?? Date.now()
      const world = generateWorld(actualSeed)
      const player = createInitialPlayer(world)
      actionRng = createRng(actualSeed + 1)
      const heirloomRng = createRng(actualSeed + 2)
      const offeredItems = generateHeirloomChoices(heirloomRng)
      set({
        world,
        player,
        turnNumber: 1,
        gamePhase: 'intro',
        activeEnemy: undefined,
        view: 'intro',
        message: null,
        gameSeed: actualSeed,
        loaded: true,
        offeredItems: [...offeredItems],
      })
    },

    loadSavedGame: async () => {
      const save = await loadGame()
      if (!save) {
        return false
      }
      actionRng = createRng(save.gameSeed + 1 + save.turnNumber)
      // Phase 3 migration: backfill inventory for pre-Phase-3 saves (ADR 0007)
      const player = save.player.inventory
        ? save.player
        : { ...save.player, inventory: { items: [], equippedItemId: null, maxSlots: 5 } }
      set({
        world: save.world,
        player,
        turnNumber: save.turnNumber,
        gamePhase: save.gamePhase,
        activeEnemy: save.activeEnemy,
        gameSeed: save.gameSeed,
        offeredItems: save.offeredItems ?? [],
        view: save.gamePhase === 'intro' ? 'intro' : 'scene',
        message: save.gamePhase === 'intro' ? null : 'Welcome back, wanderer.',
        loaded: true,
      })
      return true
    },

    newGame: (seed?: number) => {
      clearSave()
      get().initGame(seed)
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

    selectItem: (itemId: string) => {
      const { offeredItems, player, gamePhase } = get()
      const item = offeredItems.find((i) => i.id === itemId)
      if (!item) {
        set({ message: 'That item is not available.' })
        return
      }

      const addResult = engineAddItem(player, item)
      if (!addResult.success) {
        set({ message: addResult.reason ?? 'Cannot take that item.' })
        return
      }

      let updatedPlayer = addResult.player
      if (!updatedPlayer.inventory.equippedItemId) {
        const equipResult = engineEquipItem(updatedPlayer, itemId)
        if (equipResult.success) {
          updatedPlayer = equipResult.player
        }
      }

      const updates: Partial<GameStore> = {
        player: updatedPlayer,
        offeredItems: [],
      }

      if (gamePhase === 'intro') {
        updates.gamePhase = 'exploring'
        updates.view = 'scene'
        updates.message = `You receive the ${item.name}. A new adventure begins...`
      } else {
        updates.message = `You take the ${item.name}.`
      }

      set(updates)
    },

    equipItem: (itemId: string) => {
      const { player } = get()
      const result = engineEquipItem(player, itemId)
      if (!result.success) {
        set({ message: result.reason ?? 'Cannot equip that.' })
        return
      }
      const equipped = result.player.inventory.items.find((i) => i.id === itemId)
      set({
        player: result.player,
        message: equipped ? `You equip the ${equipped.name}.` : null,
      })
    },

    unequipItem: () => {
      const { player } = get()
      const current = getEquippedItem(player)
      const result = engineUnequipItem(player)
      set({
        player: result.player,
        message: current ? `You put away the ${current.name}.` : null,
      })
    },

    swapEquipment: (itemId: string) => {
      const { player } = get()
      const result = engineSwapEquipment(player, itemId)
      if (!result.success) {
        set({ message: result.reason ?? 'Cannot swap equipment.' })
        return
      }
      const equipped = result.player.inventory.items.find((i) => i.id === itemId)
      set({
        player: result.player,
        message: equipped
          ? `You spend the turn swapping to the ${equipped.name}.`
          : null,
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

    equippedItem: () => {
      const { player } = get()
      return getEquippedItem(player)
    },
  }
})

function extractSaveData(state: GameStore): SaveData {
  return {
    world: state.world,
    player: state.player,
    turnNumber: state.turnNumber,
    gamePhase: state.gamePhase,
    activeEnemy: state.activeEnemy,
    gameSeed: state.gameSeed,
    offeredItems: state.offeredItems,
  }
}

useGameStore.subscribe((state) => {
  if (state.loaded) {
    debouncedSave(extractSaveData(state))
  }
})
