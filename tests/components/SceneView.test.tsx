import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SceneView } from '../../src/components/SceneView'
import { useGameStore } from '../../src/stores/gameStore'

describe('SceneView', () => {
  const TEST_SEED = 42

  beforeEach(() => {
    useGameStore.getState().initGame(TEST_SEED)
  })

  it('renders the current tile description', () => {
    render(<SceneView />)
    const desc = screen.getByTestId('tile-description')
    expect(desc.textContent).toBeTruthy()
    expect(desc.textContent!.length).toBeGreaterThan(10)
  })

  it('displays AP and turn number', () => {
    render(<SceneView />)
    expect(screen.getByTestId('ap-display').textContent).toContain('AP:')
    expect(screen.getByTestId('turn-display').textContent).toContain('Turn 1')
  })

  it('shows peripheral glimpses', () => {
    render(<SceneView />)
    const glimpses = screen.getByTestId('peripheral-glimpses')
    expect(glimpses.children.length).toBeGreaterThanOrEqual(2)
  })

  it('has an Open Map button', () => {
    render(<SceneView />)
    expect(screen.getByTestId('open-map-button')).toBeInTheDocument()
  })

  it('has an End Turn button', () => {
    render(<SceneView />)
    expect(screen.getByTestId('end-turn-button')).toBeInTheDocument()
  })

  it('switches to map view when Open Map is clicked', async () => {
    const user = userEvent.setup()
    render(<SceneView />)
    await user.click(screen.getByTestId('open-map-button'))
    expect(useGameStore.getState().view).toBe('map')
  })

  it('increments turn and resets AP when End Turn is clicked', async () => {
    const user = userEvent.setup()
    render(<SceneView />)
    await user.click(screen.getByTestId('end-turn-button'))
    const state = useGameStore.getState()
    expect(state.turnNumber).toBe(2)
    expect(state.player.ap).toBe(state.player.maxAp)
  })

  it('displays a game message when present', () => {
    useGameStore.getState().initGame(TEST_SEED)
    render(<SceneView />)
    const msg = screen.queryByTestId('game-message')
    if (msg) {
      expect(msg.textContent).toBeTruthy()
    }
  })
})
