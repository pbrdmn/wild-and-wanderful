import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { IntroView } from '../../src/components/IntroView'
import { useGameStore } from '../../src/stores/gameStore'

describe('IntroView', () => {
  const TEST_SEED = 42

  beforeEach(() => {
    useGameStore.getState().initGame(TEST_SEED)
  })

  it('renders the narrative text', () => {
    render(<IntroView />)
    const narrative = screen.getByTestId('intro-narrative')
    expect(narrative.textContent).toContain('old badger')
  })

  it('renders 3 heirloom choices', () => {
    render(<IntroView />)
    const choices = screen.getByTestId('heirloom-choices')
    expect(choices.children).toHaveLength(3)
  })

  it('displays item name and description on each card', () => {
    render(<IntroView />)
    const { offeredItems } = useGameStore.getState()
    offeredItems.forEach((item) => {
      expect(screen.getByText(item.name)).toBeInTheDocument()
      expect(screen.getByText(item.description)).toBeInTheDocument()
    })
  })

  it('displays attack power on each card', () => {
    render(<IntroView />)
    const { offeredItems } = useGameStore.getState()
    offeredItems.forEach((item) => {
      expect(screen.getByText(`Attack: ${item.attackPower}`)).toBeInTheDocument()
    })
  })

  it('displays flavour text on each card', () => {
    render(<IntroView />)
    const { offeredItems } = useGameStore.getState()
    offeredItems.forEach((item) => {
      expect(screen.getByText(item.flavourText)).toBeInTheDocument()
    })
  })

  it('transitions to exploring when a heirloom is clicked', async () => {
    const user = userEvent.setup()
    render(<IntroView />)
    const { offeredItems } = useGameStore.getState()
    const card = screen.getByTestId(`heirloom-card-${offeredItems[0].id}`)
    await user.click(card)
    expect(useGameStore.getState().gamePhase).toBe('exploring')
    expect(useGameStore.getState().view).toBe('scene')
  })

  it('adds the selected heirloom to inventory', async () => {
    const user = userEvent.setup()
    render(<IntroView />)
    const { offeredItems } = useGameStore.getState()
    const chosen = offeredItems[1]
    const card = screen.getByTestId(`heirloom-card-${chosen.id}`)
    await user.click(card)
    const { player } = useGameStore.getState()
    expect(player.inventory.items).toHaveLength(1)
    expect(player.inventory.items[0].id).toBe(chosen.id)
    expect(player.inventory.equippedItemId).toBe(chosen.id)
  })

  it('shows the game title', () => {
    render(<IntroView />)
    expect(screen.getByText('Wild & Wanderful')).toBeInTheDocument()
  })
})
