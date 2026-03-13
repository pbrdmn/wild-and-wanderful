import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from '../../src/stores/gameStore'
import { TerrainType, DEFAULT_MAX_AP, AP_COST_REST, AP_COST_SEARCH, IMPASSABLE_TERRAIN } from '../../src/engine/types'

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

  describe('rest', () => {
    it('deducts AP when resting', () => {
      const apBefore = useGameStore.getState().player.ap
      useGameStore.getState().rest()
      expect(useGameStore.getState().player.ap).toBe(apBefore - AP_COST_REST)
    })

    it('heals a wound when player is wounded', () => {
      useGameStore.setState({
        player: { ...useGameStore.getState().player, wounds: 1 },
      })
      useGameStore.getState().rest()
      expect(useGameStore.getState().player.wounds).toBe(0)
      expect(useGameStore.getState().message).toContain('heal')
    })

    it('sets message when resting without wounds', () => {
      useGameStore.getState().rest()
      const state = useGameStore.getState()
      expect(state.message).toBeTruthy()
    })

    it('fails when AP is exhausted', () => {
      useGameStore.setState({
        player: { ...useGameStore.getState().player, ap: 0 },
      })
      useGameStore.getState().rest()
      expect(useGameStore.getState().message).toContain('AP')
    })

    it('stores gameSeed on initGame', () => {
      expect(useGameStore.getState().gameSeed).toBe(TEST_SEED)
    })
  })

  describe('search', () => {
    it('deducts AP when searching', () => {
      const apBefore = useGameStore.getState().player.ap
      useGameStore.getState().search()
      expect(useGameStore.getState().player.ap).toBe(apBefore - AP_COST_SEARCH)
    })

    it('sets a message after searching', () => {
      useGameStore.getState().search()
      expect(useGameStore.getState().message).toBeTruthy()
    })

    it('fails when AP is exhausted', () => {
      useGameStore.setState({
        player: { ...useGameStore.getState().player, ap: 0 },
      })
      useGameStore.getState().search()
      expect(useGameStore.getState().message).toContain('AP')
    })

    it('can reveal a hidden path on an adjacent impassable tile', () => {
      const { player, world } = useGameStore.getState()
      world.tiles[player.y - 1][player.x].terrain = TerrainType.Mountain
      world.tiles[player.y - 1][player.x].hasHiddenPath = false
      useGameStore.setState({ world: { ...world } })

      let revealed = false
      for (let i = 0; i < 50; i++) {
        useGameStore.getState().initGame(TEST_SEED + i)
        const state = useGameStore.getState()
        state.world.tiles[state.player.y - 1][state.player.x].terrain = TerrainType.Mountain
        state.world.tiles[state.player.y - 1][state.player.x].hasHiddenPath = false
        useGameStore.setState({ world: { ...state.world } })
        useGameStore.getState().search()
        const updated = useGameStore.getState()
        if (updated.world.tiles[updated.player.y - 1][updated.player.x].hasHiddenPath) {
          revealed = true
          break
        }
      }
      expect(revealed).toBe(true)
    })
  })
})
