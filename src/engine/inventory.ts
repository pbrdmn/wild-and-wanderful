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
  
  // Check if item already exists in inventory
  const existingItemIndex = inventory.items.findIndex(i => i.name === item.name && i.category === item.category)
  
  if (existingItemIndex !== -1) {
    // Merge with existing item by incrementing quantity
    const existingItem = inventory.items[existingItemIndex]
    const updatedItem = {
      ...existingItem,
      quantity: (existingItem.quantity || 1) + 1
    }
    
    const updatedItems = [...inventory.items]
    updatedItems[existingItemIndex] = updatedItem
    
    return {
      success: true,
      player: {
        ...player,
        inventory: { ...inventory, items: updatedItems },
      },
    }
  }
  
  // Check if inventory has space for new item
  if (inventory.items.length >= inventory.maxSlots) {
    return { success: false, player, reason: 'Inventory is full.' }
  }
  
  // Add new item with quantity of 1
  const itemWithQuantity = { ...item, quantity: 1 }
  
  return {
    success: true,
    player: {
      ...player,
      inventory: { ...inventory, items: [...inventory.items, itemWithQuantity] },
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
  
  const item = inventory.items[idx]
  const updatedItems = [...inventory.items]
  
  if (item.quantity && item.quantity > 1) {
    // Decrease quantity instead of removing item
    updatedItems[idx] = { ...item, quantity: item.quantity - 1 }
  } else {
    // Remove item entirely
    updatedItems.splice(idx, 1)
  }
  
  return {
    success: true,
    player: { ...player, inventory: { ...inventory, items: updatedItems } },
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
      inventory: { ...inventory, equippedItemId: itemId, items: inventory.items },
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
      inventory: { ...player.inventory, equippedItemId: itemId, items: player.inventory.items },
    },
  }
}

export function getEquippedItem(player: Player): Item | null {
  const { inventory } = player
  if (!inventory?.equippedItemId) return null
  return inventory.items.find((i) => i.id === inventory.equippedItemId) ?? null
}

export function activateEquippedItem(player: Player): InventoryResult {
  const { inventory } = player
  const equippedItem = getEquippedItem(player)
  
  if (!equippedItem) {
    return { success: false, player, reason: 'No item equipped.' }
  }
  
  if (!equippedItem.isConsumable) {
    // Non-consumable items (like maps) don't wear down
    return { success: true, player }
  }
  
  const updatedItems = inventory.items.map(item => {
    if (item.id === equippedItem.id) {
      const newCurrentUses = item.currentUses - 1
      
      if (newCurrentUses <= 0) {
        // Item is destroyed
        if (item.quantity && item.quantity > 1) {
          // Use next item from quantity
          return {
            ...item,
            quantity: item.quantity - 1,
            currentUses: item.maxUses
          }
        } else {
          // No more items, remove from inventory entirely
          return null
        }
      }
      
      return { ...item, currentUses: newCurrentUses }
    }
    return item
  }).filter(item => item !== null) // Remove null items (fully consumed with quantity 1)
  
  // Check if we need to unequip the item
  let newEquippedItemId = inventory.equippedItemId
  const updatedEquippedItem = updatedItems.find(i => i.id === inventory.equippedItemId)
  
  if (!updatedEquippedItem || updatedEquippedItem.currentUses <= 0) {
    newEquippedItemId = null
  }
  
  // Generate appropriate message
  let message = null
  const originalItem = inventory.items.find(i => i.id === equippedItem.id)
  if (originalItem && originalItem.currentUses === 1) {
    if (originalItem.quantity && originalItem.quantity === 1) {
      message = `Your ${originalItem.name} has worn out and been destroyed.`
    } else if (originalItem.quantity && originalItem.quantity > 1) {
      message = `Your ${originalItem.name} has worn out. You use the next one.`
    }
  }
  
  return {
    success: true,
    player: {
      ...player,
      inventory: {
        ...inventory,
        items: updatedItems,
        equippedItemId: newEquippedItemId
      }
    },
    reason: message ?? undefined
  }
}
