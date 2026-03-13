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

  it('renders zoomed viewport by default (5x5 or fewer tiles)', () => {
    render(<MapView />)
    const tiles = screen.getAllByTestId(/^tile-\d+-\d+$/)
    expect(tiles.length).toBeLessThanOrEqual(25)
    expect(tiles.length).toBeGreaterThan(0)
  })

  it('renders all tiles when zoom is toggled off', async () => {
    const user = userEvent.setup()
    render(<MapView />)
    await user.click(screen.getByTestId('zoom-toggle'))
    const totalTiles = DEFAULT_WORLD_SIZE * DEFAULT_WORLD_SIZE
    const tiles = screen.getAllByTestId(/^tile-\d+-\d+$/)
    expect(tiles.length).toBe(totalTiles)
  })

  it('shows fog for tiles that are neither explored nor adjacent', () => {
    render(<MapView />)
    const nonVisibleTile = screen.getAllByTestId(/^tile-\d+-\d+$/).find(
      (el) => el.getAttribute('data-visible') === 'false',
    )
    expect(nonVisibleTile).toBeDefined()
  })

  it('shows adjacent tiles as visible even when unexplored', () => {
    render(<MapView />)
    const { player, world } = useGameStore.getState()

    const adjacentCoords = [
      { x: player.x, y: player.y - 1 },
      { x: player.x, y: player.y + 1 },
      { x: player.x - 1, y: player.y },
      { x: player.x + 1, y: player.y },
    ].filter(({ x, y }) => x >= 0 && x < world.width && y >= 0 && y < world.height)

    for (const { x, y } of adjacentCoords) {
      const el = screen.getByTestId(`tile-${x}-${y}`)
      expect(el.getAttribute('data-visible')).toBe('true')
    }
  })

  it('shows explored tiles with terrain data', () => {
    render(<MapView />)
    const { player } = useGameStore.getState()
    const playerTile = screen.getByTestId(`tile-${player.x}-${player.y}`)
    expect(playerTile.getAttribute('data-explored')).toBe('true')
  })

  it('does not display AP on map (exploration is free)', () => {
    render(<MapView />)
    expect(screen.queryByTestId('map-ap-display')).not.toBeInTheDocument()
  })

  it('shows only a Close Map button', () => {
    render(<MapView />)
    expect(screen.queryByTestId('travel-button')).not.toBeInTheDocument()
    expect(screen.getByTestId('close-map-button')).toBeInTheDocument()
  })

  it('switches to scene view when Close Map is clicked', async () => {
    const user = userEvent.setup()
    render(<MapView />)
    await user.click(screen.getByTestId('close-map-button'))
    expect(useGameStore.getState().view).toBe('scene')
  })

  it('moves the player and closes the map immediately on tile click', async () => {
    const user = userEvent.setup()
    render(<MapView />)

    const { player } = useGameStore.getState()
    const movable = useGameStore.getState().movableTiles()
    expect(movable.length).toBeGreaterThan(0)

    const target = movable[0].tile
    await user.click(screen.getByTestId(`tile-${target.x}-${target.y}`))

    const updated = useGameStore.getState()
    expect(updated.player.x).toBe(target.x)
    expect(updated.player.y).toBe(target.y)
    expect(updated.player.ap).toBe(player.ap)
    expect(updated.view).toBe('scene')
  })

  it('does not move when clicking a non-adjacent tile', async () => {
    const user = userEvent.setup()
    render(<MapView />)

    const { player } = useGameStore.getState()
    const farX = Math.min(player.x + 2, DEFAULT_WORLD_SIZE - 1)
    const farTile = screen.getByTestId(`tile-${farX}-${player.y}`)
    await user.click(farTile)

    const updated = useGameStore.getState()
    expect(updated.player.x).toBe(player.x)
    expect(updated.player.y).toBe(player.y)
  })

  it('clears message when switching views', () => {
    useGameStore.setState({ message: 'A new adventure begins...' })
    useGameStore.getState().setView('map')
    expect(useGameStore.getState().message).toBeNull()
  })
})
