import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { IntroView } from '../../src/components/IntroView'
import { useGameStore } from '../../src/stores/gameStore'

async function advanceToHeirloomStep() {
  const user = userEvent.setup()
  const confirmBtn = screen.getByTestId('confirm-character')
  await user.click(confirmBtn)
  return user
}

describe('IntroView', () => {
  const TEST_SEED = 42

  beforeEach(() => {
    useGameStore.getState().initGame(TEST_SEED)
  })

  it('shows the game title', () => {
    render(<IntroView />)
    expect(screen.getByText('Wild & Wanderful')).toBeInTheDocument()
  })

  it('starts on the character creation step', () => {
    render(<IntroView />)
    expect(screen.getByTestId('name-input')).toBeInTheDocument()
    expect(screen.getByTestId('species-choices')).toBeInTheDocument()
  })

  it('renders 7 species choices', () => {
    render(<IntroView />)
    const grid = screen.getByTestId('species-choices')
    expect(grid.children).toHaveLength(7)
  })

  it('advances to heirloom step after confirming character', async () => {
    const user = userEvent.setup()
    render(<IntroView />)
    await user.type(screen.getByTestId('name-input'), 'Bramble')
    await user.click(screen.getByTestId('species-card-bear'))
    await user.click(screen.getByTestId('confirm-character'))
    expect(screen.getByTestId('heirloom-choices')).toBeInTheDocument()
    const { player } = useGameStore.getState()
    expect(player.name).toBe('Bramble')
    expect(player.species).toBe('bear')
  })

  it('defaults name to Wanderer if left blank', async () => {
    render(<IntroView />)
    await advanceToHeirloomStep()
    const { player } = useGameStore.getState()
    expect(player.name).toBe('Wanderer')
  })

  it('renders the narrative text on heirloom step', async () => {
    render(<IntroView />)
    await advanceToHeirloomStep()
    const narrative = screen.getByTestId('intro-narrative')
    expect(narrative.textContent).toContain('old badger')
  })

  it('renders 3 heirloom choices', async () => {
    render(<IntroView />)
    await advanceToHeirloomStep()
    const choices = screen.getByTestId('heirloom-choices')
    expect(choices.children).toHaveLength(3)
  })

  it('displays item name and description on each card', async () => {
    render(<IntroView />)
    await advanceToHeirloomStep()
    const { offeredItems } = useGameStore.getState()
    offeredItems.forEach((item) => {
      expect(screen.getByText(item.name)).toBeInTheDocument()
      expect(screen.getByText(item.description)).toBeInTheDocument()
    })
  })

  it('displays attack power on each card', async () => {
    render(<IntroView />)
    await advanceToHeirloomStep()
    const { offeredItems } = useGameStore.getState()
    offeredItems.forEach((item) => {
      expect(screen.getByText(`Attack: ${item.attackPower}`)).toBeInTheDocument()
    })
  })

  it('displays flavour text on each card', async () => {
    render(<IntroView />)
    await advanceToHeirloomStep()
    const { offeredItems } = useGameStore.getState()
    offeredItems.forEach((item) => {
      expect(screen.getByText(item.flavourText)).toBeInTheDocument()
    })
  })

  it('transitions to exploring when a heirloom is clicked', async () => {
    render(<IntroView />)
    const user = await advanceToHeirloomStep()
    const { offeredItems } = useGameStore.getState()
    const card = screen.getByTestId(`heirloom-card-${offeredItems[0].id}`)
    await user.click(card)
    expect(useGameStore.getState().gamePhase).toBe('exploring')
    expect(useGameStore.getState().view).toBe('scene')
  })

  it('adds the selected heirloom to inventory', async () => {
    render(<IntroView />)
    const user = await advanceToHeirloomStep()
    const { offeredItems } = useGameStore.getState()
    const chosen = offeredItems[1]
    const card = screen.getByTestId(`heirloom-card-${chosen.id}`)
    await user.click(card)
    const { player } = useGameStore.getState()
    expect(player.inventory.items).toHaveLength(1)
    expect(player.inventory.items[0].id).toBe(chosen.id)
    expect(player.inventory.equippedItemId).toBe(chosen.id)
  })
})
