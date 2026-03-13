import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from '../../src/stores/gameStore'
import { TerrainType, DEFAULT_MAX_AP } from '../../src/engine/types'

describe('gameStore', () => {
  const TEST_SEED = 42

  beforeEach(() => {
    useGameStore.getState().initGame(TEST_SEED)
  })

  describe('initGame', () => {
    it('creates a world with tiles', () => {
      const { world } = useGameStore.getState()
      expect(world.tiles.length).toBe(20)
      expect(world.tiles[0].length).toBe(20)
    })

    it('places the player at the starting village', () => {
      const { player, world } = useGameStore.getState()
      const tile = world.tiles[player.y][player.x]
      expect(tile.terrain).toBe(TerrainType.Village)
      expect(tile.isExplored).toBe(true)
    })

    it('sets initial AP to max', () => {
      const { player } = useGameStore.getState()
      expect(player.ap).toBe(DEFAULT_MAX_AP)
    })

    it('starts on turn 1 in exploring phase', () => {
      const state = useGameStore.getState()
      expect(state.turnNumber).toBe(1)
      expect(state.gamePhase).toBe('exploring')
    })

    it('starts in scene view', () => {
      expect(useGameStore.getState().view).toBe('scene')
    })
  })

  describe('movePlayer', () => {
    it('moves to an adjacent passable tile', () => {
      const { player, world } = useGameStore.getState()
      const movable = useGameStore.getState().movableTiles()
      expect(movable.length).toBeGreaterThan(0)

      const target = movable[0].tile
      const success = useGameStore.getState().movePlayer(target.x, target.y)
      expect(success).toBe(true)

      const updated = useGameStore.getState()
      expect(updated.player.x).toBe(target.x)
      expect(updated.player.y).toBe(target.y)
      expect(updated.player.ap).toBe(player.ap - 1)
    })

    it('fails when AP is exhausted', () => {
      const store = useGameStore.getState()
      // Exhaust AP by moving repeatedly
      for (let i = 0; i < DEFAULT_MAX_AP; i++) {
        const movable = useGameStore.getState().movableTiles()
        if (movable.length > 0) {
          useGameStore.getState().movePlayer(movable[0].tile.x, movable[0].tile.y)
        }
      }
      const movable = useGameStore.getState().movableTiles()
      if (movable.length > 0) {
        const success = useGameStore.getState().movePlayer(movable[0].tile.x, movable[0].tile.y)
        expect(success).toBe(false)
      }
    })

    it('marks the destination tile as explored', () => {
      const movable = useGameStore.getState().movableTiles()
      if (movable.length > 0) {
        const target = movable[0].tile
        useGameStore.getState().movePlayer(target.x, target.y)
        const { world } = useGameStore.getState()
        expect(world.tiles[target.y][target.x].isExplored).toBe(true)
      }
    })
  })

  describe('endTurn', () => {
    it('resets AP and increments turn number', () => {
      const movable = useGameStore.getState().movableTiles()
      if (movable.length > 0) {
        useGameStore.getState().movePlayer(movable[0].tile.x, movable[0].tile.y)
      }
      useGameStore.getState().endTurn()
      const state = useGameStore.getState()
      expect(state.player.ap).toBe(DEFAULT_MAX_AP)
      expect(state.turnNumber).toBe(2)
    })
  })

  describe('setView', () => {
    it('switches between scene and map views', () => {
      useGameStore.getState().setView('map')
      expect(useGameStore.getState().view).toBe('map')
      useGameStore.getState().setView('scene')
      expect(useGameStore.getState().view).toBe('scene')
    })
  })

  describe('derived state', () => {
    it('returns a tile description', () => {
      const desc = useGameStore.getState().currentTileDescription()
      expect(desc.length).toBeGreaterThan(0)
    })

    it('returns peripheral glimpses', () => {
      const glimpses = useGameStore.getState().peripheralGlimpses()
      expect(glimpses.length).toBeGreaterThanOrEqual(2)
      glimpses.forEach((g) => {
        expect(g.text).toMatch(/^To the/)
      })
    })

    it('returns adjacent tiles', () => {
      const adj = useGameStore.getState().adjacentTiles()
      expect(adj.length).toBeGreaterThanOrEqual(2)
    })

    it('returns only movable tiles (passable)', () => {
      const movable = useGameStore.getState().movableTiles()
      movable.forEach((m) => {
        expect(
          m.tile.hasHiddenPath || !['mountain', 'swamp', 'thicket'].includes(m.tile.terrain)
        ).toBe(true)
      })
    })
  })
})
