import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InventoryView } from '../../src/components/InventoryView'
import { useGameStore } from '../../src/stores/gameStore'
import { DEFAULT_MAX_AP } from '../../src/engine/types'

function initWithHeirloom(seed = 42) {
  useGameStore.getState().initGame(seed)
  const { offeredItems } = useGameStore.getState()
  useGameStore.getState().selectItem(offeredItems[0].id)
}

describe('InventoryView', () => {
  beforeEach(() => {
    initWithHeirloom()
  })

  it('renders the inventory title', () => {
    render(<InventoryView />)
    expect(screen.getByText('Inventory')).toBeInTheDocument()
  })

  it('shows slot count', () => {
    render(<InventoryView />)
    expect(screen.getByTestId('slot-count').textContent).toBe('1/5')
  })

  it('renders items in the inventory list', () => {
    render(<InventoryView />)
    const list = screen.getByTestId('inventory-list')
    expect(list.children).toHaveLength(1)
  })

  it('shows equipped badge on equipped item', () => {
    render(<InventoryView />)
    expect(screen.getByText('Equipped')).toBeInTheDocument()
  })

  it('shows item details when an item is tapped', async () => {
    const user = userEvent.setup()
    render(<InventoryView />)
    const { player } = useGameStore.getState()
    const item = player.inventory.items[0]
    await user.click(screen.getByTestId(`inventory-item-${item.id}`))
    const details = screen.getByTestId('item-details')
    expect(details).toBeInTheDocument()
    expect(details.textContent).toContain(item.description)
  })

  it('shows unequip button for equipped item', async () => {
    const user = userEvent.setup()
    render(<InventoryView />)
    const { player } = useGameStore.getState()
    const item = player.inventory.items[0]
    await user.click(screen.getByTestId(`inventory-item-${item.id}`))
    expect(screen.getByTestId('unequip-button')).toBeInTheDocument()
  })

  it('unequips item when unequip button is clicked', async () => {
    const user = userEvent.setup()
    render(<InventoryView />)
    const { player } = useGameStore.getState()
    const item = player.inventory.items[0]
    await user.click(screen.getByTestId(`inventory-item-${item.id}`))
    await user.click(screen.getByTestId('unequip-button'))
    expect(useGameStore.getState().player.inventory.equippedItemId).toBeNull()
  })

  it('shows equip button for unequipped item when nothing else is equipped', async () => {
    const user = userEvent.setup()
    useGameStore.getState().unequipItem()
    render(<InventoryView />)
    const { player } = useGameStore.getState()
    const item = player.inventory.items[0]
    await user.click(screen.getByTestId(`inventory-item-${item.id}`))
    expect(screen.getByTestId('equip-button')).toBeInTheDocument()
  })

  it('shows swap button with AP cost when another item is equipped', async () => {
    const user = userEvent.setup()

    useGameStore.getState().initGame(42)
    const { offeredItems } = useGameStore.getState()
    useGameStore.getState().selectItem(offeredItems[0].id)

    useGameStore.setState({ offeredItems: [offeredItems[1]] })
    useGameStore.getState().selectItem(offeredItems[1].id)

    render(<InventoryView />)

    const { player } = useGameStore.getState()
    const unequipped = player.inventory.items.find(
      (i) => i.id !== player.inventory.equippedItemId
    )
    if (unequipped) {
      await user.click(screen.getByTestId(`inventory-item-${unequipped.id}`))
      const swapBtn = screen.getByTestId('swap-button')
      expect(swapBtn).toBeInTheDocument()
      expect(swapBtn.textContent).toContain(`${DEFAULT_MAX_AP} AP`)
    }
  })

  it('disables swap button when AP is insufficient', async () => {
    const user = userEvent.setup()

    useGameStore.getState().initGame(42)
    const { offeredItems } = useGameStore.getState()
    useGameStore.getState().selectItem(offeredItems[0].id)
    useGameStore.setState({ offeredItems: [offeredItems[1]] })
    useGameStore.getState().selectItem(offeredItems[1].id)
    useGameStore.setState({
      player: { ...useGameStore.getState().player, ap: 1 },
    })

    render(<InventoryView />)

    const { player } = useGameStore.getState()
    const unequipped = player.inventory.items.find(
      (i) => i.id !== player.inventory.equippedItemId
    )
    if (unequipped) {
      await user.click(screen.getByTestId(`inventory-item-${unequipped.id}`))
      expect(screen.getByTestId('swap-button')).toBeDisabled()
    }
  })

  it('closes inventory and returns to scene view', async () => {
    const user = userEvent.setup()
    render(<InventoryView />)
    await user.click(screen.getByTestId('close-inventory-button'))
    expect(useGameStore.getState().view).toBe('scene')
  })

  it('shows empty message when inventory is empty', () => {
    useGameStore.setState({
      player: {
        ...useGameStore.getState().player,
        inventory: { items: [], equippedItemId: null, maxSlots: 5 },
      },
    })
    render(<InventoryView />)
    expect(screen.getByTestId('empty-inventory')).toBeInTheDocument()
  })
})
