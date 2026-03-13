import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from '../../src/stores/gameStore'
import { TerrainType, DEFAULT_MAX_AP, AP_COST_REST, AP_COST_SEARCH, AP_COST_SWAP, ItemCategory } from '../../src/engine/types'

function initAndSkipIntro(seed: number) {
  useGameStore.getState().initGame(seed)
  const { offeredItems } = useGameStore.getState()
  if (offeredItems.length > 0) {
    useGameStore.getState().selectItem(offeredItems[0].id)
  }
}

describe('gameStore', () => {
  const TEST_SEED = 42

  beforeEach(() => {
    initAndSkipIntro(TEST_SEED)
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

    it('starts on turn 1 in intro phase before selection', () => {
      useGameStore.getState().initGame(TEST_SEED)
      const state = useGameStore.getState()
      expect(state.turnNumber).toBe(1)
      expect(state.gamePhase).toBe('intro')
      expect(state.view).toBe('intro')
    })

    it('transitions to exploring after selecting a heirloom', () => {
      const state = useGameStore.getState()
      expect(state.gamePhase).toBe('exploring')
      expect(state.view).toBe('scene')
    })

    it('generates 3 heirloom choices on init', () => {
      useGameStore.getState().initGame(TEST_SEED)
      const { offeredItems } = useGameStore.getState()
      expect(offeredItems).toHaveLength(3)
      const categories = offeredItems.map((i) => i.category).sort()
      expect(categories).toEqual([ItemCategory.Magic, ItemCategory.Melee, ItemCategory.Ranged])
    })
  })

  describe('movePlayer', () => {
    it('moves to an adjacent passable tile', () => {
      const { player } = useGameStore.getState()
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

    it('switches to inventory view', () => {
      useGameStore.getState().setView('inventory')
      expect(useGameStore.getState().view).toBe('inventory')
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

    it('returns the equipped item', () => {
      const equipped = useGameStore.getState().equippedItem()
      expect(equipped).not.toBeNull()
      expect(equipped!.name).toBeTruthy()
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
        initAndSkipIntro(TEST_SEED + i)
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

  describe('selectItem', () => {
    it('adds the selected item to inventory and equips it', () => {
      useGameStore.getState().initGame(TEST_SEED)
      const { offeredItems } = useGameStore.getState()
      const chosen = offeredItems[1]
      useGameStore.getState().selectItem(chosen.id)

      const { player } = useGameStore.getState()
      expect(player.inventory.items).toHaveLength(1)
      expect(player.inventory.items[0].id).toBe(chosen.id)
      expect(player.inventory.equippedItemId).toBe(chosen.id)
    })

    it('transitions from intro to exploring', () => {
      useGameStore.getState().initGame(TEST_SEED)
      expect(useGameStore.getState().gamePhase).toBe('intro')
      const { offeredItems } = useGameStore.getState()
      useGameStore.getState().selectItem(offeredItems[0].id)
      expect(useGameStore.getState().gamePhase).toBe('exploring')
      expect(useGameStore.getState().view).toBe('scene')
    })

    it('clears offeredItems after selection', () => {
      useGameStore.getState().initGame(TEST_SEED)
      const { offeredItems } = useGameStore.getState()
      useGameStore.getState().selectItem(offeredItems[0].id)
      expect(useGameStore.getState().offeredItems).toHaveLength(0)
    })

    it('sets a message mentioning the item name', () => {
      useGameStore.getState().initGame(TEST_SEED)
      const { offeredItems } = useGameStore.getState()
      const chosen = offeredItems[0]
      useGameStore.getState().selectItem(chosen.id)
      expect(useGameStore.getState().message).toContain(chosen.name)
    })

    it('fails for an invalid item id', () => {
      useGameStore.getState().initGame(TEST_SEED)
      useGameStore.getState().selectItem('nonexistent')
      expect(useGameStore.getState().gamePhase).toBe('intro')
      expect(useGameStore.getState().message).toContain('not available')
    })
  })

  describe('equipItem / unequipItem / swapEquipment', () => {
    it('equips an item from inventory', () => {
      const { player } = useGameStore.getState()
      const itemId = player.inventory.items[0]?.id
      if (itemId) {
        useGameStore.getState().unequipItem()
        expect(useGameStore.getState().player.inventory.equippedItemId).toBeNull()
        useGameStore.getState().equipItem(itemId)
        expect(useGameStore.getState().player.inventory.equippedItemId).toBe(itemId)
      }
    })

    it('unequips the current item', () => {
      useGameStore.getState().unequipItem()
      expect(useGameStore.getState().player.inventory.equippedItemId).toBeNull()
    })

    it('swapEquipment costs full AP', () => {
      const { player } = useGameStore.getState()
      const currentId = player.inventory.equippedItemId

      useGameStore.getState().initGame(TEST_SEED)
      const { offeredItems } = useGameStore.getState()
      useGameStore.getState().selectItem(offeredItems[0].id)

      useGameStore.setState({
        offeredItems: [offeredItems[1]],
      })
      useGameStore.getState().selectItem(offeredItems[1].id)

      const state = useGameStore.getState()
      const items = state.player.inventory.items
      if (items.length >= 2) {
        const otherId = items.find((i) => i.id !== state.player.inventory.equippedItemId)?.id
        if (otherId) {
          useGameStore.getState().swapEquipment(otherId)
          const after = useGameStore.getState()
          expect(after.player.ap).toBe(0)
          expect(after.player.inventory.equippedItemId).toBe(otherId)
        }
      }
    })

    it('swapEquipment fails without full AP', () => {
      useGameStore.setState({
        player: { ...useGameStore.getState().player, ap: 1 },
      })
      const { player } = useGameStore.getState()
      const itemId = player.inventory.items[0]?.id
      if (itemId) {
        useGameStore.getState().swapEquipment(itemId)
        expect(useGameStore.getState().message).toContain('full turn')
      }
    })
  })
})
