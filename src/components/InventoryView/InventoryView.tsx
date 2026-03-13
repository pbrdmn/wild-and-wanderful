import { useState } from 'react'
import { useGameStore } from '../../stores/gameStore'
import { ItemCategory, AP_COST_SWAP } from '../../engine/types'
import type { Item } from '../../engine/types'
import styles from './InventoryView.module.css'

const CATEGORY_LABELS: Record<string, string> = {
  [ItemCategory.Melee]: 'Melee',
  [ItemCategory.Ranged]: 'Ranged',
  [ItemCategory.Magic]: 'Magic',
}

export function InventoryView() {
  const player = useGameStore((s) => s.player)
  const setView = useGameStore((s) => s.setView)
  const equipItem = useGameStore((s) => s.equipItem)
  const unequipItem = useGameStore((s) => s.unequipItem)
  const swapEquipment = useGameStore((s) => s.swapEquipment)
  const message = useGameStore((s) => s.message)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const { items, equippedItemId } = player.inventory
  const selectedItem = selectedId ? items.find((i) => i.id === selectedId) : null
  const isEquipped = selectedId === equippedItemId

  function handleItemTap(item: Item) {
    setSelectedId(selectedId === item.id ? null : item.id)
  }

  return (
    <div className={styles.inventoryView}>
      <header className={styles.header}>
        <h1 className={styles.title}>Inventory</h1>
        <span className={styles.slotCount} data-testid="slot-count">
          {items.length}/{player.inventory.maxSlots}
        </span>
      </header>

      <main className={styles.content}>
        {items.length === 0 && (
          <p className={styles.emptyMsg} data-testid="empty-inventory">
            Your pack is empty.
          </p>
        )}

        <ul className={styles.itemList} data-testid="inventory-list">
          {items.map((item) => {
            const equipped = item.id === equippedItemId
            const selected = item.id === selectedId
            return (
              <li key={item.id}>
                <button
                  className={`${styles.itemRow} ${equipped ? styles.equipped : ''} ${selected ? styles.selected : ''}`}
                  onClick={() => handleItemTap(item)}
                  data-testid={`inventory-item-${item.id}`}
                >
                  <div className={styles.itemInfo}>
                    <span className={styles.itemName}>
                      {item.name}
                      {equipped && <span className={styles.equippedBadge}>Equipped</span>}
                    </span>
                    <span className={styles.itemMeta}>
                      {CATEGORY_LABELS[item.category] ?? item.category} &middot; Atk {item.attackPower}
                    </span>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>

        {selectedItem && (
          <div className={styles.details} data-testid="item-details">
            <p className={styles.detailDesc}>{selectedItem.description}</p>
            <p className={styles.detailFlavour}>{selectedItem.flavourText}</p>
            <div className={styles.detailActions}>
              {isEquipped ? (
                <button
                  className={styles.actionBtn}
                  onClick={() => { unequipItem(); setSelectedId(null) }}
                  data-testid="unequip-button"
                >
                  Unequip
                </button>
              ) : (
                <>
                  {!equippedItemId && (
                    <button
                      className={styles.actionBtn}
                      onClick={() => { equipItem(selectedId!); setSelectedId(null) }}
                      data-testid="equip-button"
                    >
                      Equip
                    </button>
                  )}
                  {equippedItemId && (
                    <button
                      className={`${styles.actionBtn} ${player.ap < AP_COST_SWAP ? styles.btnDisabled : ''}`}
                      onClick={() => { swapEquipment(selectedId!); setSelectedId(null) }}
                      disabled={player.ap < AP_COST_SWAP}
                      data-testid="swap-button"
                    >
                      Swap ({AP_COST_SWAP} AP)
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {message && (
          <p className={styles.message} data-testid="inventory-message" role="status">
            {message}
          </p>
        )}
      </main>

      <footer className={styles.footer}>
        <button
          className={styles.closeBtn}
          onClick={() => setView('scene')}
          data-testid="close-inventory-button"
        >
          Close
        </button>
      </footer>
    </div>
  )
}
