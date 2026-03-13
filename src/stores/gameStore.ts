import { create } from 'zustand'
import type { GameState, Player, World, GamePhase, ActiveEnemy, Item, Skill, AnimalSpecies, LeaderboardEntry } from '../engine/types'
import { DEFAULT_MAX_AP, Direction, DIRECTION_OFFSETS, AnimalSpecies as AnimalSpeciesEnum } from '../engine/types'
import { generateWorld, findStartingPosition } from '../engine/world'
import { movePlayer as engineMovePlayer, getAdjacentTiles, canMoveTo } from '../engine/movement'
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
import {
  getAvailableSkills as engineGetAvailableSkills,
  canUseSkill as engineCanUseSkill,
  unlockSkill as engineUnlockSkill,
  setActiveSkills as engineSetActiveSkills,
  getSkillById,
} from '../engine/skills'
import {
  playerBasicAttack,
  playerSkillAttack,
  enemyTurn as engineEnemyTurn,
  attemptFlee as engineAttemptFlee,
  getCombatOutcome,
} from '../engine/combat'
import { checkTileEncounter } from '../engine/enemies'
import { resolveDiscovery } from '../engine/discoveries'
import { calculateXpReward, checkLevelUp } from '../engine/progression'
import { createLeaderboardEntry, addToLeaderboard } from '../engine/leaderboard'
import { getTileDescription, getPeripheralGlimpse } from '../engine/biomes'
import { createRng } from '../engine/random'
import { debouncedSave, loadGame, clearSave, saveLeaderboard, loadLeaderboard as loadLeaderboardFromStorage } from '../utils/persistence'
import type { SaveData } from '../utils/persistence'

export type ViewMode = 'scene' | 'map' | 'inventory' | 'intro' | 'skills' | 'runEnd' | 'leaderboard'

interface GameActions {
  initGame: (seed?: number) => void
  loadSavedGame: () => Promise<boolean>
  newGame: (seed?: number) => void
  setWanderer: (name: string, species: AnimalSpecies) => void
  movePlayer: (x: number, y: number) => boolean
  endTurn: () => void
  setView: (view: ViewMode) => void
  rest: () => void
  search: () => void
  selectItem: (itemId: string) => void
  equipItem: (itemId: string) => void
  unequipItem: () => void
  swapEquipment: (itemId: string) => void
  attack: () => void
  useSkill: (skillId: string) => void
  flee: () => void
  unlockSkill: (skillId: string) => void
  setActiveSkills: (skillIds: string[]) => void
  retire: () => void
  completeQuest: () => void
  saveWandererToLeaderboard: () => Promise<void>
  loadLeaderboard: () => Promise<void>
}

interface GameDerived {
  currentTileDescription: () => string
  peripheralGlimpses: () => { direction: Direction; text: string }[]
  adjacentTiles: () => AdjacentTile[]
  movableTiles: () => AdjacentTile[]
  equippedItem: () => Item | null
  availableSkills: () => Skill[]
}

interface GameStore extends GameState, GameActions, GameDerived {
  view: ViewMode
  message: string | null
  gameSeed: number
  loaded: boolean
  offeredItems: Item[]
  combatLog: string[]
  playerDodgeChance: number
  playerHasShield: boolean
  previousPosition: { x: number; y: number } | null
  leaderboard: LeaderboardEntry[]
}

function createInitialPlayer(
  world: World,
  name = 'Wanderer',
  species: AnimalSpecies = AnimalSpeciesEnum.Fox,
): Player {
  const start = findStartingPosition(world)
  return {
    x: start.x,
    y: start.y,
    ap: DEFAULT_MAX_AP,
    maxAp: DEFAULT_MAX_AP,
    name,
    species,
    level: 1,
    xp: 0,
    wounds: 0,
    maxWounds: 1,
    inventory: { items: [], equippedItemId: null, maxSlots: 5 },
    unlockedSkillIds: [],
    activeSkillIds: [],
    maxActiveSkills: 2,
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
    combatRounds: 1,
    gamePhase: 'intro' as GamePhase,
    activeEnemy: undefined,
    view: 'intro' as ViewMode,
    message: null,
    gameSeed: defaultSeed,
    loaded: false,
    offeredItems: [],
    combatLog: [],
    playerDodgeChance: 0,
    playerHasShield: false,
    previousPosition: null,
    leaderboard: [],

    initGame: (seed?: number) => {
      const actualSeed = seed ?? Date.now()
      const { leaderboard } = get()
      const world = generateWorld(actualSeed, undefined, leaderboard)
      const player = createInitialPlayer(world)
      actionRng = createRng(actualSeed + 1)
      const heirloomRng = createRng(actualSeed + 2)
      const offeredItems = generateHeirloomChoices(heirloomRng)
      set({
        world,
        player,
        combatRounds: 1,
        gamePhase: 'intro',
        activeEnemy: undefined,
        view: 'intro',
        message: null,
        gameSeed: actualSeed,
        loaded: true,
        offeredItems: [...offeredItems],
        combatLog: [],
        playerDodgeChance: 0,
        playerHasShield: false,
        previousPosition: null,
      })
    },

    loadSavedGame: async () => {
      const save = await loadGame()
      if (!save) {
        return false
      }
      actionRng = createRng(save.gameSeed + 1 + save.combatRounds)
      set({
        world: save.world,
        player: save.player,
        combatRounds: save.combatRounds,
        gamePhase: save.gamePhase,
        activeEnemy: save.activeEnemy,
        gameSeed: save.gameSeed,
        offeredItems: save.offeredItems ?? [],
        view: save.gamePhase === 'intro' ? 'intro' : 'scene',
        message: save.gamePhase === 'intro' ? null : 'Welcome back, wanderer.',
        loaded: true,
        combatLog: [],
        playerDodgeChance: 0,
        playerHasShield: false,
        previousPosition: null,
      })
      return true
    },

    newGame: (seed?: number) => {
      clearSave()
      get().initGame(seed)
    },

    setWanderer: (name: string, species: AnimalSpecies) => {
      const { player } = get()
      set({ player: { ...player, name, species } })
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

      const updates: Partial<GameStore> = {
        player: result.player,
        world: { ...world, tiles: newTiles },
        message: null,
        previousPosition: { x: player.x, y: player.y },
      }

      if (x === world.questMarker.x && y === world.questMarker.y) {
        set(updates)
        get().completeQuest()
        return true
      }

      const encounter = checkTileEncounter(result.tile, actionRng)
      if (encounter) {
        newTiles[y][x] = { ...newTiles[y][x], enemyId: undefined }
        updates.world = { ...world, tiles: newTiles }
        updates.player = { ...result.player, ap: result.player.maxAp }
        updates.gamePhase = 'combat'
        updates.activeEnemy = encounter
        updates.combatLog = [`A ${encounter.name} appears!`]
        updates.message = `A ${encounter.name} blocks your path!`
        updates.playerDodgeChance = 0
        updates.playerHasShield = false
      } else if (result.tile.discoveryId) {
        const discoveryResult = resolveDiscovery(updates.player!, result.tile.discoveryId)
        if (discoveryResult) {
          updates.player = discoveryResult.player
          updates.message = discoveryResult.message
          newTiles[y][x] = { ...newTiles[y][x], discoveryId: undefined }
          updates.world = { ...world, tiles: newTiles }
        }
      }

      set(updates)
      return true
    },

    endTurn: () => {
      const { player, combatRounds, gamePhase } = get()
      if (gamePhase !== 'combat') return
      set({
        player: { ...player, ap: player.maxAp },
        combatRounds: combatRounds + 1,
        message: `Round ${combatRounds + 1} begins.`,
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
        updates.player = { ...result.player, ap: result.player.maxAp }
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

    attack: () => {
      const { player, activeEnemy, combatLog, playerDodgeChance, playerHasShield } = get()
      if (!activeEnemy) return

      const result = playerBasicAttack(player, activeEnemy)
      if (!result.success) {
        set({ message: result.reason ?? 'Cannot attack.' })
        return
      }

      const newLog = [...combatLog, ...result.messages]
      const outcome = getCombatOutcome(result.player, result.enemy)

      if (outcome === 'victory') {
        const xp = calculateXpReward(activeEnemy)
        let victoryPlayer = { ...result.player, xp: result.player.xp + xp }
        const levelResult = checkLevelUp(victoryPlayer)
        victoryPlayer = levelResult.player
        const levelMsg = levelResult.leveled ? ` You are now level ${levelResult.newLevel}!` : ''
        set({
          player: victoryPlayer,
          activeEnemy: undefined,
          gamePhase: 'exploring',
          combatLog: [],
          message: `${newLog[newLog.length - 1]} (+${xp} XP)${levelMsg}`,
          playerDodgeChance: 0,
          playerHasShield: false,
        })
        return
      }

      const enemyResult = engineEnemyTurn(result.enemy, result.player, playerDodgeChance, playerHasShield)
      const fullLog = [...newLog, ...enemyResult.messages]
      const postEnemyOutcome = getCombatOutcome(enemyResult.player, enemyResult.enemy)

      if (postEnemyOutcome === 'defeat') {
        const startPos = findStartingPosition(get().world)
        set({
          player: { ...enemyResult.player, x: startPos.x, y: startPos.y, wounds: 0, ap: DEFAULT_MAX_AP },
          activeEnemy: undefined,
          gamePhase: 'exploring',
          combatLog: [],
          message: 'You retreat to the village, battered but alive.',
          playerDodgeChance: 0,
          playerHasShield: false,
        })
        return
      }

      set({
        player: enemyResult.player,
        activeEnemy: enemyResult.enemy,
        combatLog: fullLog.slice(-5),
        message: fullLog[fullLog.length - 1],
        playerDodgeChance: 0,
        playerHasShield: false,
      })
    },

    useSkill: (skillId: string) => {
      const { player, activeEnemy, combatLog, playerDodgeChance, playerHasShield } = get()
      if (!activeEnemy) return

      const skill = getSkillById(skillId)
      if (!skill) {
        set({ message: 'Unknown skill.' })
        return
      }

      if (!engineCanUseSkill(player, skillId)) {
        set({ message: 'Cannot use this skill right now.' })
        return
      }

      const result = playerSkillAttack(player, activeEnemy, skill)
      if (!result.success) {
        set({ message: result.reason ?? 'Skill failed.' })
        return
      }

      const newLog = [...combatLog, ...result.messages]
      const outcome = getCombatOutcome(result.player, result.enemy)

      if (outcome === 'victory') {
        const xp = calculateXpReward(activeEnemy)
        let victoryPlayer = { ...result.player, xp: result.player.xp + xp }
        const levelResult = checkLevelUp(victoryPlayer)
        victoryPlayer = levelResult.player
        const levelMsg = levelResult.leveled ? ` You are now level ${levelResult.newLevel}!` : ''
        set({
          player: victoryPlayer,
          activeEnemy: undefined,
          gamePhase: 'exploring',
          combatLog: [],
          message: `${newLog[newLog.length - 1]} (+${xp} XP)${levelMsg}`,
          playerDodgeChance: 0,
          playerHasShield: false,
        })
        return
      }

      let newDodge = 0
      let newShield = false
      if (skill.effect.type === 'dodge_next') {
        newDodge = skill.effect.chance
      }
      if (skill.effect.type === 'status' && skill.effect.statusEffect === 'shield') {
        newShield = true
      }

      const enemyResult = engineEnemyTurn(result.enemy, result.player, newDodge, newShield)
      const fullLog = [...newLog, ...enemyResult.messages]
      const postEnemyOutcome = getCombatOutcome(enemyResult.player, enemyResult.enemy)

      if (postEnemyOutcome === 'defeat') {
        const startPos = findStartingPosition(get().world)
        set({
          player: { ...enemyResult.player, x: startPos.x, y: startPos.y, wounds: 0, ap: DEFAULT_MAX_AP },
          activeEnemy: undefined,
          gamePhase: 'exploring',
          combatLog: [],
          message: 'You retreat to the village, battered but alive.',
          playerDodgeChance: 0,
          playerHasShield: false,
        })
        return
      }

      if (postEnemyOutcome === 'victory') {
        const xp = calculateXpReward(activeEnemy)
        let victoryPlayer = { ...enemyResult.player, xp: enemyResult.player.xp + xp }
        const levelResult = checkLevelUp(victoryPlayer)
        victoryPlayer = levelResult.player
        const levelMsg = levelResult.leveled ? ` You are now level ${levelResult.newLevel}!` : ''
        set({
          player: victoryPlayer,
          activeEnemy: undefined,
          gamePhase: 'exploring',
          combatLog: [],
          message: `${fullLog[fullLog.length - 1]} (+${xp} XP)${levelMsg}`,
          playerDodgeChance: 0,
          playerHasShield: false,
        })
        return
      }

      set({
        player: enemyResult.player,
        activeEnemy: enemyResult.enemy,
        combatLog: fullLog.slice(-5),
        message: fullLog[fullLog.length - 1],
        playerDodgeChance: 0,
        playerHasShield: false,
      })
    },

    flee: () => {
      const { player, previousPosition, combatLog } = get()
      const result = engineAttemptFlee(player, actionRng)

      if (!result.success) {
        set({ message: result.reason ?? 'Cannot flee.' })
        return
      }

      if (result.fled) {
        const fleePos = previousPosition ?? { x: player.x, y: player.y }
        set({
          player: { ...result.player, x: fleePos.x, y: fleePos.y },
          activeEnemy: undefined,
          gamePhase: 'exploring',
          combatLog: [],
          message: result.message,
          playerDodgeChance: 0,
          playerHasShield: false,
        })
        return
      }

      const { activeEnemy, playerDodgeChance, playerHasShield } = get()
      if (!activeEnemy) return

      const enemyResult = engineEnemyTurn(activeEnemy, result.player, playerDodgeChance, playerHasShield)
      const fullLog = [...combatLog, result.message, ...enemyResult.messages]
      const outcome = getCombatOutcome(enemyResult.player, enemyResult.enemy)

      if (outcome === 'defeat') {
        const startPos = findStartingPosition(get().world)
        set({
          player: { ...enemyResult.player, x: startPos.x, y: startPos.y, wounds: 0, ap: DEFAULT_MAX_AP },
          activeEnemy: undefined,
          gamePhase: 'exploring',
          combatLog: [],
          message: 'You retreat to the village, battered but alive.',
          playerDodgeChance: 0,
          playerHasShield: false,
        })
        return
      }

      set({
        player: enemyResult.player,
        activeEnemy: enemyResult.enemy,
        combatLog: fullLog.slice(-5),
        message: fullLog[fullLog.length - 1],
        playerDodgeChance: 0,
        playerHasShield: false,
      })
    },

    unlockSkill: (skillId: string) => {
      const { player } = get()
      const result = engineUnlockSkill(player, skillId)
      if (!result.success) {
        set({ message: result.reason ?? 'Cannot unlock skill.' })
        return
      }
      const skill = getSkillById(skillId)
      set({
        player: result.player,
        message: skill ? `You learn ${skill.name}!` : null,
      })
    },

    setActiveSkills: (skillIds: string[]) => {
      const { player } = get()
      const result = engineSetActiveSkills(player, skillIds)
      if (!result.success) {
        set({ message: result.reason ?? 'Cannot set active skills.' })
        return
      }
      set({
        player: result.player,
        message: 'Active skills updated.',
      })
    },

    retire: () => {
      const { player, combatRounds, leaderboard } = get()
      const entry = createLeaderboardEntry(player, combatRounds, false)
      const updated = addToLeaderboard(leaderboard, entry)
      saveLeaderboard(updated)
      clearSave()
      set({
        gamePhase: 'retired',
        view: 'runEnd' as ViewMode,
        message: 'You retire from adventuring, your tales told by the fireside.',
        leaderboard: updated,
      })
    },

    completeQuest: () => {
      const { player, combatRounds, leaderboard } = get()
      const entry = createLeaderboardEntry(player, combatRounds, true)
      const updated = addToLeaderboard(leaderboard, entry)
      saveLeaderboard(updated)
      clearSave()
      set({
        gamePhase: 'questComplete',
        view: 'runEnd' as ViewMode,
        message: 'You have reached the end of your quest!',
        leaderboard: updated,
      })
    },

    saveWandererToLeaderboard: async () => {
      const { player, combatRounds, gamePhase, leaderboard } = get()
      const questCompleted = gamePhase === 'questComplete'
      const entry = createLeaderboardEntry(player, combatRounds, questCompleted)
      const updated = addToLeaderboard(leaderboard, entry)
      await saveLeaderboard(updated)
      set({ leaderboard: updated })
    },

    loadLeaderboard: async () => {
      const entries = await loadLeaderboardFromStorage()
      set({ leaderboard: entries })
    },

    setView: (view: ViewMode) => {
      set({ view, message: null })
    },

    currentTileDescription: () => {
      const { player, world } = get()
      const tile = world.tiles[player.y][player.x]
      return getTileDescription(tile.terrain, player.x * 31 + player.y * 17)
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

    availableSkills: () => {
      const { player } = get()
      return engineGetAvailableSkills(player)
    },
  }
})

function extractSaveData(state: GameStore): SaveData {
  return {
    world: state.world,
    player: state.player,
    combatRounds: state.combatRounds,
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
