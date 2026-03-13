import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SceneView } from '../../src/components/SceneView'
import { useGameStore } from '../../src/stores/gameStore'
import { DEFAULT_MAX_AP } from '../../src/engine/types'
import type { ActiveEnemy } from '../../src/engine/types'

function initAndSkipIntro(seed: number) {
  useGameStore.getState().initGame(seed)
  const { offeredItems } = useGameStore.getState()
  if (offeredItems.length > 0) {
    useGameStore.getState().selectItem(offeredItems[0].id)
  }
}

describe('SceneView', () => {
  const TEST_SEED = 42

  beforeEach(() => {
    initAndSkipIntro(TEST_SEED)
  })

  it('renders the current tile description', () => {
    render(<SceneView />)
    const desc = screen.getByTestId('tile-description')
    expect(desc.textContent).toBeTruthy()
    expect(desc.textContent!.length).toBeGreaterThan(10)
  })

  it('hides AP display during exploration', () => {
    render(<SceneView />)
    expect(screen.queryByTestId('ap-display')).not.toBeInTheDocument()
  })

  it('displays wound count', () => {
    render(<SceneView />)
    const wounds = screen.getByTestId('wounds-display')
    expect(wounds.textContent).toContain('Wounds:')
    expect(wounds.textContent).toContain('0/1')
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

  it('hides End Turn button during exploration', () => {
    render(<SceneView />)
    expect(screen.queryByTestId('end-turn-button')).not.toBeInTheDocument()
  })

  it('has a Search button', () => {
    render(<SceneView />)
    expect(screen.getByTestId('search-button')).toBeInTheDocument()
  })

  it('has a Rest button', () => {
    render(<SceneView />)
    expect(screen.getByTestId('rest-button')).toBeInTheDocument()
  })

  it('has an Inventory button', () => {
    render(<SceneView />)
    expect(screen.getByTestId('open-inventory-button')).toBeInTheDocument()
  })

  it('switches to map view when Open Map is clicked', async () => {
    const user = userEvent.setup()
    render(<SceneView />)
    await user.click(screen.getByTestId('open-map-button'))
    expect(useGameStore.getState().view).toBe('map')
  })

  it('switches to inventory view when Pack is clicked', async () => {
    const user = userEvent.setup()
    render(<SceneView />)
    await user.click(screen.getByTestId('open-inventory-button'))
    expect(useGameStore.getState().view).toBe('inventory')
  })

  it('shows End Turn button and AP display during combat', () => {
    const enemy: ActiveEnemy = {
      name: 'Test',
      strength: 1,
      hp: 2,
      maxHp: 2,
      hasInitiative: false,
      statusEffects: [],
    }
    useGameStore.setState({
      gamePhase: 'combat',
      activeEnemy: enemy,
      combatLog: [],
    })
    render(<SceneView />)
    expect(screen.getByTestId('end-turn-button')).toBeInTheDocument()
    expect(screen.getByTestId('ap-display')).toBeInTheDocument()
  })

  it('displays a game message when present', () => {
    initAndSkipIntro(TEST_SEED)
    render(<SceneView />)
    const msg = screen.queryByTestId('game-message')
    if (msg) {
      expect(msg.textContent).toBeTruthy()
    }
  })

  it('disables Rest button when player has no wounds', () => {
    render(<SceneView />)
    const restButton = screen.getByTestId('rest-button')
    expect(restButton).toBeDisabled()
  })

  it('enables Rest button when player has wounds', () => {
    useGameStore.setState({
      player: { ...useGameStore.getState().player, wounds: 1 },
    })
    render(<SceneView />)
    const restButton = screen.getByTestId('rest-button')
    expect(restButton).not.toBeDisabled()
  })

  it('Search button is always enabled during exploration', () => {
    useGameStore.setState({
      player: { ...useGameStore.getState().player, ap: 0 },
    })
    render(<SceneView />)
    const searchButton = screen.getByTestId('search-button')
    expect(searchButton).not.toBeDisabled()
  })

  it('does not deduct AP when Search is clicked', async () => {
    const user = userEvent.setup()
    render(<SceneView />)
    await user.click(screen.getByTestId('search-button'))
    expect(useGameStore.getState().player.ap).toBe(DEFAULT_MAX_AP)
  })

  it('heals wound when Rest is clicked with wounds', async () => {
    const user = userEvent.setup()
    useGameStore.setState({
      player: { ...useGameStore.getState().player, wounds: 1 },
    })
    render(<SceneView />)
    await user.click(screen.getByTestId('rest-button'))
    expect(useGameStore.getState().player.wounds).toBe(0)
  })

  it('shows the equipped item name', () => {
    render(<SceneView />)
    const equipped = screen.getByTestId('equipped-display')
    expect(equipped).toBeInTheDocument()
    const { player } = useGameStore.getState()
    const item = player.inventory.items.find((i) => i.id === player.inventory.equippedItemId)
    if (item) {
      expect(equipped.textContent).toContain(item.name)
    }
  })

  it('hides equipped bar when nothing is equipped', () => {
    useGameStore.setState({
      player: {
        ...useGameStore.getState().player,
        inventory: { ...useGameStore.getState().player.inventory, equippedItemId: null },
      },
    })
    render(<SceneView />)
    expect(screen.queryByTestId('equipped-display')).not.toBeInTheDocument()
  })

  it('has a Skills button', () => {
    render(<SceneView />)
    expect(screen.getByTestId('open-skills-button')).toBeInTheDocument()
  })

  it('switches to skills view when Skills is clicked', async () => {
    const user = userEvent.setup()
    render(<SceneView />)
    await user.click(screen.getByTestId('open-skills-button'))
    expect(useGameStore.getState().view).toBe('skills')
  })

  describe('combat UI', () => {
    function enterCombat() {
      const enemy: ActiveEnemy = {
        name: 'Shadow Wolf',
        strength: 1,
        hp: 2,
        maxHp: 2,
        hasInitiative: false,
        statusEffects: [],
      }
      useGameStore.setState({
        gamePhase: 'combat',
        activeEnemy: enemy,
        combatLog: ['A Shadow Wolf appears!'],
      })
    }

    it('shows the combat panel when in combat', () => {
      enterCombat()
      render(<SceneView />)
      expect(screen.getByTestId('combat-panel')).toBeInTheDocument()
    })

    it('displays enemy name and HP bar', () => {
      enterCombat()
      render(<SceneView />)
      expect(screen.getByTestId('enemy-info').textContent).toContain('Shadow Wolf')
      expect(screen.getByTestId('enemy-hp-bar')).toBeInTheDocument()
    })

    it('shows attack and flee buttons in combat', () => {
      enterCombat()
      render(<SceneView />)
      expect(screen.getByTestId('attack-button')).toBeInTheDocument()
      expect(screen.getByTestId('flee-button')).toBeInTheDocument()
    })

    it('shows combat log entries', () => {
      enterCombat()
      render(<SceneView />)
      const log = screen.getByTestId('combat-log')
      expect(log.textContent).toContain('Shadow Wolf appears')
    })

    it('hides exploration actions during combat', () => {
      enterCombat()
      render(<SceneView />)
      expect(screen.queryByTestId('open-map-button')).not.toBeInTheDocument()
      expect(screen.queryByTestId('search-button')).not.toBeInTheDocument()
      expect(screen.queryByTestId('rest-button')).not.toBeInTheDocument()
    })

    it('keeps end turn button during combat', () => {
      enterCombat()
      render(<SceneView />)
      expect(screen.getByTestId('end-turn-button')).toBeInTheDocument()
    })

    it('hides peripheral glimpses during combat', () => {
      enterCombat()
      render(<SceneView />)
      expect(screen.queryByTestId('peripheral-glimpses')).not.toBeInTheDocument()
    })

    it('shows combat actions container', () => {
      enterCombat()
      render(<SceneView />)
      expect(screen.getByTestId('combat-actions')).toBeInTheDocument()
    })

    it('disables attack when no weapon equipped', () => {
      enterCombat()
      useGameStore.setState({
        player: {
          ...useGameStore.getState().player,
          inventory: { items: [], equippedItemId: null, maxSlots: 5 },
        },
      })
      render(<SceneView />)
      expect(screen.getByTestId('attack-button')).toBeDisabled()
    })

    it('disables attack when no AP', () => {
      enterCombat()
      useGameStore.setState({
        player: { ...useGameStore.getState().player, ap: 0 },
      })
      render(<SceneView />)
      expect(screen.getByTestId('attack-button')).toBeDisabled()
    })

    it('shows enemy status effects', () => {
      const enemy: ActiveEnemy = {
        name: 'Test',
        strength: 1,
        hp: 2,
        maxHp: 2,
        hasInitiative: false,
        statusEffects: [{ type: 'daze', remainingTurns: 1 }],
      }
      useGameStore.setState({
        gamePhase: 'combat',
        activeEnemy: enemy,
        combatLog: [],
      })
      render(<SceneView />)
      expect(screen.getByTestId('enemy-status-effects')).toBeInTheDocument()
    })
  })
})
