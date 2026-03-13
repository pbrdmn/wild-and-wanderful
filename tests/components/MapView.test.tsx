import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MapView } from '../../src/components/MapView'
import { useGameStore } from '../../src/stores/gameStore'
import { DEFAULT_WORLD_SIZE } from '../../src/engine/types'

describe('MapView', () => {
  const TEST_SEED = 42

  beforeEach(() => {
    useGameStore.getState().initGame(TEST_SEED)
    useGameStore.getState().setView('map')
  })

  it('renders the map grid', () => {
    render(<MapView />)
    const grid = screen.getByTestId('map-grid')
    expect(grid).toBeInTheDocument()
  })

  it('renders the correct number of tiles', () => {
    render(<MapView />)
    const totalTiles = DEFAULT_WORLD_SIZE * DEFAULT_WORLD_SIZE
    const tiles = screen.getAllByTestId(/^tile-\d+-\d+$/)
    expect(tiles.length).toBe(totalTiles)
  })

  it('shows fog of war for unexplored tiles', () => {
    render(<MapView />)
    const unexploredTile = screen.getAllByTestId(/^tile-\d+-\d+$/).find(
      (el) => el.getAttribute('data-explored') === 'false',
    )
    expect(unexploredTile).toBeDefined()
  })

  it('shows explored tiles with terrain data', () => {
    render(<MapView />)
    const { player } = useGameStore.getState()
    const playerTile = screen.getByTestId(`tile-${player.x}-${player.y}`)
    expect(playerTile.getAttribute('data-explored')).toBe('true')
  })

  it('displays AP', () => {
    render(<MapView />)
    expect(screen.getByTestId('map-ap-display').textContent).toContain('AP:')
  })

  it('has a Back to Scene button', () => {
    render(<MapView />)
    expect(screen.getByTestId('back-to-scene-button')).toBeInTheDocument()
  })

  it('switches back to scene view when Back to Scene is clicked', async () => {
    const user = userEvent.setup()
    render(<MapView />)
    await user.click(screen.getByTestId('back-to-scene-button'))
    expect(useGameStore.getState().view).toBe('scene')
  })

  it('moves the player when clicking an adjacent movable tile', async () => {
    const user = userEvent.setup()
    render(<MapView />)

    const { player } = useGameStore.getState()
    const movable = useGameStore.getState().movableTiles()
    expect(movable.length).toBeGreaterThan(0)

    const target = movable[0].tile
    const tileEl = screen.getByTestId(`tile-${target.x}-${target.y}`)
    await user.click(tileEl)

    const updated = useGameStore.getState()
    expect(updated.player.x).toBe(target.x)
    expect(updated.player.y).toBe(target.y)
    expect(updated.player.ap).toBe(player.ap - 1)
  })

  it('does not move when clicking a non-adjacent tile', async () => {
    const user = userEvent.setup()
    render(<MapView />)

    const { player } = useGameStore.getState()
    // Click a tile 2 away
    const farX = Math.min(player.x + 2, DEFAULT_WORLD_SIZE - 1)
    const farTile = screen.getByTestId(`tile-${farX}-${player.y}`)
    await user.click(farTile)

    const updated = useGameStore.getState()
    expect(updated.player.x).toBe(player.x)
    expect(updated.player.y).toBe(player.y)
  })
})
