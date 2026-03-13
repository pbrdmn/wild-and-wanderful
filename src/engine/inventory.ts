import type { Player, Item, Inventory } from './types'
import { AP_COST_SWAP, DEFAULT_INVENTORY_SLOTS } from './types'

export interface InventoryResult {
  success: boolean
  player: Player
  reason?: string
}

export function createEmptyInventory(maxSlots = DEFAULT_INVENTORY_SLOTS): Inventory {
  return { items: [], equippedItemId: null, maxSlots }
}

export function addItem(player: Player, item: Item): InventoryResult {
  const { inventory } = player
  if (inventory.items.length >= inventory.maxSlots) {
    return { success: false, player, reason: 'Inventory is full.' }
  }
  return {
    success: true,
    player: {
      ...player,
      inventory: { ...inventory, items: [...inventory.items, item] },
    },
  }
}

export function removeItem(player: Player, itemId: string): InventoryResult {
  const { inventory } = player
  if (inventory.equippedItemId === itemId) {
    return { success: false, player, reason: 'Cannot remove an equipped item.' }
  }
  const idx = inventory.items.findIndex((i) => i.id === itemId)
  if (idx === -1) {
    return { success: false, player, reason: 'Item not found in inventory.' }
  }
  const items = inventory.items.filter((i) => i.id !== itemId)
  return {
    success: true,
    player: { ...player, inventory: { ...inventory, items } },
  }
}

export function equipItem(player: Player, itemId: string): InventoryResult {
  const { inventory } = player
  const item = inventory.items.find((i) => i.id === itemId)
  if (!item) {
    return { success: false, player, reason: 'Item not found in inventory.' }
  }
  return {
    success: true,
    player: {
      ...player,
      inventory: { ...inventory, equippedItemId: itemId },
    },
  }
}

export function unequipItem(player: Player): InventoryResult {
  return {
    success: true,
    player: {
      ...player,
      inventory: { ...player.inventory, equippedItemId: null },
    },
  }
}

export function swapEquipment(player: Player, itemId: string): InventoryResult {
  if (player.ap < AP_COST_SWAP) {
    return { success: false, player, reason: 'Swapping equipment requires a full turn of AP.' }
  }
  const item = player.inventory.items.find((i) => i.id === itemId)
  if (!item) {
    return { success: false, player, reason: 'Item not found in inventory.' }
  }
  if (player.inventory.equippedItemId === itemId) {
    return { success: false, player, reason: 'Item is already equipped.' }
  }
  return {
    success: true,
    player: {
      ...player,
      ap: 0,
      inventory: { ...player.inventory, equippedItemId: itemId },
    },
  }
}

export function getEquippedItem(player: Player): Item | null {
  const { inventory } = player
  if (!inventory?.equippedItemId) return null
  return inventory.items.find((i) => i.id === inventory.equippedItemId) ?? null
}
