import { describe, it, expect } from 'vitest'
import {
  createEmptyInventory,
  addItem,
  removeItem,
  equipItem,
  unequipItem,
  swapEquipment,
  getEquippedItem,
} from '../../src/engine/inventory'
import type { Player, Item } from '../../src/engine/types'
import { ItemCategory, DEFAULT_MAX_AP } from '../../src/engine/types'

function makeItem(overrides: Partial<Item> = {}): Item {
  return {
    id: 'item-1',
    name: 'Test Sword',
    category: ItemCategory.Melee,
    description: 'A test weapon.',
    attackPower: 3,
    flavourText: 'For testing only.',
    maxUses: 20,
    currentUses: 20,
    isConsumable: true,
    ...overrides,
  }
}

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    x: 0, y: 0,
    ap: DEFAULT_MAX_AP, maxAp: DEFAULT_MAX_AP,
    name: 'Test', species: 'fox', level: 1, xp: 0,
    wounds: 0, maxWounds: 1,
    inventory: createEmptyInventory(),
    unlockedSkillIds: [], activeSkillIds: [], maxActiveSkills: 2,
    ...overrides,
  }
}

describe('createEmptyInventory', () => {
  it('creates an inventory with default slots', () => {
    const inv = createEmptyInventory()
    expect(inv.items).toEqual([])
    expect(inv.equippedItemId).toBeNull()
    expect(inv.maxSlots).toBe(5)
  })

  it('accepts a custom slot count', () => {
    const inv = createEmptyInventory(3)
    expect(inv.maxSlots).toBe(3)
  })
})

describe('addItem', () => {
  it('adds an item to an empty inventory', () => {
    const player = makePlayer()
    const item = makeItem()
    const result = addItem(player, item)
    expect(result.success).toBe(true)
    expect(result.player.inventory.items).toHaveLength(1)
    expect(result.player.inventory.items[0].id).toBe('item-1')
  })

  it('fails when inventory is full', () => {
    const items = Array.from({ length: 5 }, (_, i) => makeItem({ id: `item-${i}`, name: `Item ${i}` })) // Different names to avoid merging
    const player = makePlayer({
      inventory: { items, equippedItemId: null, maxSlots: 5 },
    })
    const result = addItem(player, makeItem({ id: 'item-overflow', name: 'Overflow Item' }))
    expect(result.success).toBe(false)
    expect(result.reason).toContain('full')
  })

  it('merges duplicate items by incrementing quantity', () => {
    const item1 = makeItem({ id: 'item-1' })
    const item2 = makeItem({ id: 'item-2', name: 'Test Sword' }) // Same name and category
    const player = makePlayer({
      inventory: { items: [item1], equippedItemId: null, maxSlots: 5 },
    })
    const result = addItem(player, item2)
    expect(result.success).toBe(true)
    expect(result.player.inventory.items).toHaveLength(1)
    expect(result.player.inventory.items[0].quantity).toBe(2)
  })

  it('adds new item when no duplicates exist', () => {
    const item1 = makeItem({ id: 'item-1', quantity: 1 }) // Ensure first item has quantity
    const item2 = makeItem({ id: 'item-2', name: 'Different Sword', quantity: 1 }) // Different name
    const player = makePlayer({
      inventory: { items: [item1], equippedItemId: null, maxSlots: 5 },
    })
    const result = addItem(player, item2)
    expect(result.success).toBe(true)
    expect(result.player.inventory.items).toHaveLength(2)
    expect(result.player.inventory.items[0].quantity).toBe(1)
    expect(result.player.inventory.items[1].quantity).toBe(1)
  })

  it('does not mutate the original player', () => {
    const player = makePlayer()
    addItem(player, makeItem())
    expect(player.inventory.items).toHaveLength(0)
  })
})

describe('removeItem', () => {
  it('removes an unequipped item', () => {
    const item = makeItem()
    const player = makePlayer({
      inventory: { items: [item], equippedItemId: null, maxSlots: 5 },
    })
    const result = removeItem(player, 'item-1')
    expect(result.success).toBe(true)
    expect(result.player.inventory.items).toHaveLength(0)
  })

  it('fails when item is equipped', () => {
    const item = makeItem()
    const player = makePlayer({
      inventory: { items: [item], equippedItemId: 'item-1', maxSlots: 5 },
    })
    const result = removeItem(player, 'item-1')
    expect(result.success).toBe(false)
    expect(result.reason).toContain('equipped')
  })

  it('fails when item is not found', () => {
    const player = makePlayer()
    const result = removeItem(player, 'nonexistent')
    expect(result.success).toBe(false)
    expect(result.reason).toContain('not found')
  })
})

describe('equipItem', () => {
  it('equips an item from inventory', () => {
    const item = makeItem()
    const player = makePlayer({
      inventory: { items: [item], equippedItemId: null, maxSlots: 5 },
    })
    const result = equipItem(player, 'item-1')
    expect(result.success).toBe(true)
    expect(result.player.inventory.equippedItemId).toBe('item-1')
  })

  it('swaps to a different equipped item', () => {
    const items = [makeItem({ id: 'a' }), makeItem({ id: 'b' })]
    const player = makePlayer({
      inventory: { items, equippedItemId: 'a', maxSlots: 5 },
    })
    const result = equipItem(player, 'b')
    expect(result.success).toBe(true)
    expect(result.player.inventory.equippedItemId).toBe('b')
  })

  it('fails when item is not in inventory', () => {
    const player = makePlayer()
    const result = equipItem(player, 'nonexistent')
    expect(result.success).toBe(false)
    expect(result.reason).toContain('not found')
  })
})

describe('unequipItem', () => {
  it('clears the equipped item', () => {
    const item = makeItem()
    const player = makePlayer({
      inventory: { items: [item], equippedItemId: 'item-1', maxSlots: 5 },
    })
    const result = unequipItem(player)
    expect(result.success).toBe(true)
    expect(result.player.inventory.equippedItemId).toBeNull()
  })

  it('succeeds even when nothing is equipped', () => {
    const player = makePlayer()
    const result = unequipItem(player)
    expect(result.success).toBe(true)
    expect(result.player.inventory.equippedItemId).toBeNull()
  })
})

describe('swapEquipment', () => {
  it('equips a new item and sets AP to 0', () => {
    const items = [makeItem({ id: 'a' }), makeItem({ id: 'b' })]
    const player = makePlayer({
      inventory: { items, equippedItemId: 'a', maxSlots: 5 },
    })
    const result = swapEquipment(player, 'b')
    expect(result.success).toBe(true)
    expect(result.player.inventory.equippedItemId).toBe('b')
    expect(result.player.ap).toBe(0)
  })

  it('fails when AP is less than full', () => {
    const items = [makeItem({ id: 'a' }), makeItem({ id: 'b' })]
    const player = makePlayer({
      ap: DEFAULT_MAX_AP - 1,
      inventory: { items, equippedItemId: 'a', maxSlots: 5 },
    })
    const result = swapEquipment(player, 'b')
    expect(result.success).toBe(false)
    expect(result.reason).toContain('full turn')
  })

  it('fails when item is not in inventory', () => {
    const player = makePlayer()
    const result = swapEquipment(player, 'nonexistent')
    expect(result.success).toBe(false)
  })

  it('fails when trying to swap to the already-equipped item', () => {
    const item = makeItem()
    const player = makePlayer({
      inventory: { items: [item], equippedItemId: 'item-1', maxSlots: 5 },
    })
    const result = swapEquipment(player, 'item-1')
    expect(result.success).toBe(false)
    expect(result.reason).toContain('already equipped')
  })

  it('does not mutate the original player', () => {
    const items = [makeItem({ id: 'a' }), makeItem({ id: 'b' })]
    const player = makePlayer({
      inventory: { items, equippedItemId: 'a', maxSlots: 5 },
    })
    swapEquipment(player, 'b')
    expect(player.ap).toBe(DEFAULT_MAX_AP)
    expect(player.inventory.equippedItemId).toBe('a')
  })
})

describe('getEquippedItem', () => {
  it('returns the equipped item', () => {
    const item = makeItem()
    const player = makePlayer({
      inventory: { items: [item], equippedItemId: 'item-1', maxSlots: 5 },
    })
    expect(getEquippedItem(player)).toEqual(item)
  })

  it('returns null when nothing is equipped', () => {
    const player = makePlayer()
    expect(getEquippedItem(player)).toBeNull()
  })

  it('returns null when equippedItemId references a missing item', () => {
    const player = makePlayer({
      inventory: { items: [], equippedItemId: 'ghost', maxSlots: 5 },
    })
    expect(getEquippedItem(player)).toBeNull()
  })
})
