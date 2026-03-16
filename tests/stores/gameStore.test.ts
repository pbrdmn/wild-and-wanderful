import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from '../../src/stores/gameStore'
import { TerrainType, DEFAULT_MAX_AP, AP_COST_ATTACK, ItemCategory } from '../../src/engine/types'
import type { ActiveEnemy } from '../../src/engine/types'

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

    it('starts with combatRounds 1 in intro phase before selection', () => {
      useGameStore.getState().initGame(TEST_SEED)
      const state = useGameStore.getState()
      expect(state.combatRounds).toBe(1)
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
    it('moves to an adjacent passable tile without deducting AP', () => {
      const { player } = useGameStore.getState()
      const movable = useGameStore.getState().movableTiles()
      expect(movable.length).toBeGreaterThan(0)

      const target = movable[0].tile
      const success = useGameStore.getState().movePlayer(target.x, target.y)
      expect(success).toBe(true)

      const updated = useGameStore.getState()
      expect(updated.player.x).toBe(target.x)
      expect(updated.player.y).toBe(target.y)
      expect(updated.player.ap).toBe(player.ap)
    })

    it('can move multiple times without AP limit', () => {
      for (let i = 0; i < DEFAULT_MAX_AP + 2; i++) {
        const movable = useGameStore.getState().movableTiles()
        if (movable.length > 0) {
          const success = useGameStore.getState().movePlayer(movable[0].tile.x, movable[0].tile.y)
          expect(success).toBe(true)
        }
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
    it('does nothing outside combat', () => {
      const roundsBefore = useGameStore.getState().combatRounds
      useGameStore.getState().endTurn()
      expect(useGameStore.getState().combatRounds).toBe(roundsBefore)
    })

    it('resets AP and increments combat rounds during combat', () => {
      useGameStore.setState({
        gamePhase: 'combat',
        player: { ...useGameStore.getState().player, ap: 0 },
      })
      useGameStore.getState().endTurn()
      const state = useGameStore.getState()
      expect(state.player.ap).toBe(DEFAULT_MAX_AP)
      expect(state.combatRounds).toBe(2)
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
    it('does not deduct AP when resting (exploration is free)', () => {
      const apBefore = useGameStore.getState().player.ap
      useGameStore.getState().rest()
      expect(useGameStore.getState().player.ap).toBe(apBefore)
    })

    it('heals HP when player is below max HP', () => {
      useGameStore.setState({
        player: { ...useGameStore.getState().player, hp: 4 },
      })
      useGameStore.getState().rest()
      expect(useGameStore.getState().player.hp).toBe(5)
      expect(useGameStore.getState().message).toContain('heal')
    })

    it('sets message when resting without wounds', () => {
      useGameStore.getState().rest()
      const state = useGameStore.getState()
      expect(state.message).toBeTruthy()
    })

    it('stores gameSeed on initGame', () => {
      expect(useGameStore.getState().gameSeed).toBe(TEST_SEED)
    })
  })

  describe('search', () => {
    it('does not deduct AP when searching (exploration is free)', () => {
      const apBefore = useGameStore.getState().player.ap
      useGameStore.getState().search()
      expect(useGameStore.getState().player.ap).toBe(apBefore)
    })

    it('sets a message after searching', () => {
      useGameStore.getState().search()
      expect(useGameStore.getState().message).toBeTruthy()
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

  describe('combat actions', () => {
    function enterCombat() {
      const enemy: ActiveEnemy = {
        name: 'Test Enemy',
        strength: 1,
        level: 1,
        hp: 3,
        maxHp: 3,
        hasInitiative: false,
        statusEffects: [],
      }
      useGameStore.setState({
        gamePhase: 'combat',
        activeEnemy: enemy,
        combatLog: [],
      })
    }

    it('attack deals damage to the enemy', () => {
      enterCombat()
      const hpBefore = useGameStore.getState().activeEnemy!.hp
      useGameStore.getState().attack()
      const state = useGameStore.getState()
      if (state.activeEnemy) {
        expect(state.activeEnemy.hp).toBeLessThan(hpBefore)
      }
      expect(state.player.ap).toBe(DEFAULT_MAX_AP - AP_COST_ATTACK)
    })

    it('attack transitions to exploring on victory', () => {
      const enemy: ActiveEnemy = {
        name: 'Weak Enemy',
        strength: 1,
        level: 1,
        hp: 1,
        maxHp: 1,
        hasInitiative: false,
        statusEffects: [],
      }
      useGameStore.setState({
        gamePhase: 'combat',
        activeEnemy: enemy,
        combatLog: [],
      })
      useGameStore.getState().attack()
      const state = useGameStore.getState()
      expect(state.gamePhase).toBe('exploring')
      expect(state.activeEnemy).toBeUndefined()
    })

    it('attack succeeds when no weapon is equipped (fists)', () => {
      enterCombat()
      useGameStore.setState({
        player: {
          ...useGameStore.getState().player,
          inventory: { items: [], equippedItemId: null, maxSlots: 5 },
        },
        activeEnemy: {
          ...useGameStore.getState().activeEnemy!,
          hp: 1, // Make enemy weak so fists can defeat it
        },
      })
      useGameStore.getState().attack()
      // After fists attack, enemy should be defeated, so we should see victory message
      expect(useGameStore.getState().message).toContain('defeated')
    })

    it('flee returns player to exploring when successful', () => {
      enterCombat()
      let fled = false
      for (let i = 0; i < 20; i++) {
        enterCombat()
        useGameStore.setState({
          player: { ...useGameStore.getState().player, ap: DEFAULT_MAX_AP },
        })
        useGameStore.getState().flee()
        if (useGameStore.getState().gamePhase === 'exploring') {
          fled = true
          break
        }
      }
      expect(fled).toBe(true)
    })

    it('flee fails when AP is insufficient', () => {
      enterCombat()
      useGameStore.setState({
        player: { ...useGameStore.getState().player, ap: 0 },
      })
      useGameStore.getState().flee()
      expect(useGameStore.getState().message).toContain('AP')
      expect(useGameStore.getState().gamePhase).toBe('combat')
    })
  })

  describe('skill actions', () => {
    it('unlockSkill adds skill to player', () => {
      useGameStore.getState().unlockSkill('heavy-strike')
      expect(useGameStore.getState().player.unlockedSkillIds).toContain('heavy-strike')
    })

    it('unlockSkill fails for unknown skill', () => {
      useGameStore.getState().unlockSkill('nonexistent')
      expect(useGameStore.getState().message).toContain('Unknown')
    })

    it('setActiveSkills updates active skills', () => {
      useGameStore.getState().unlockSkill('heavy-strike')
      useGameStore.getState().unlockSkill('parry')
      useGameStore.getState().setActiveSkills(['heavy-strike', 'parry'])
      expect(useGameStore.getState().player.activeSkillIds).toEqual(['heavy-strike', 'parry'])
    })

    it('setActiveSkills fails when exceeding max', () => {
      useGameStore.getState().unlockSkill('heavy-strike')
      useGameStore.getState().unlockSkill('parry')
      useGameStore.getState().unlockSkill('daze-slam')
      useGameStore.getState().setActiveSkills(['heavy-strike', 'parry', 'daze-slam'])
      expect(useGameStore.getState().message).toContain('2')
    })

    it('availableSkills returns skills matching equipped item', () => {
      useGameStore.getState().unlockSkill('heavy-strike')
      useGameStore.getState().setActiveSkills(['heavy-strike'])
      const equipped = useGameStore.getState().equippedItem()
      const skills = useGameStore.getState().availableSkills()
      if (equipped?.category === 'melee') {
        // Should include Search (immediate use, no requirements) and Heavy Strike (melee)
        expect(skills).toHaveLength(2)
        const skillIds = skills.map(s => s.id)
        expect(skillIds).toContain('search')
        expect(skillIds).toContain('heavy-strike')
      }
    })
  })
})
