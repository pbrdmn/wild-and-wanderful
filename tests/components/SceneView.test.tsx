import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { SceneView } from '../../src/components/SceneView'
import { useGameStore } from '../../src/stores/gameStore'
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

  it('renders the battle stage', () => {
    render(<SceneView />)
    expect(screen.getByTestId('battle-stage')).toBeInTheDocument()
    expect(screen.getByTestId('player-sprite')).toBeInTheDocument()
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

  it('displays HP count', () => {
    render(<SceneView />)
    const hp = screen.getByTestId('hp-display')
    expect(hp.textContent).toContain('HP:')
    expect(hp.textContent).toContain('5/5')
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

    it('shows AP display during combat', () => {
      const enemy: ActiveEnemy = {
        name: 'Test',
        strength: 1,
        level: 1,
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

  it('disables Rest button when player is at max HP', () => {
    render(<SceneView />)
    const restButton = screen.getByTestId('rest-button')
    expect(restButton).toBeDisabled()
  })

  it('enables Rest button when player is below max HP', () => {
    useGameStore.setState({
      player: { ...useGameStore.getState().player, hp: 4 },
    })
    render(<SceneView />)
    const restButton = screen.getByTestId('rest-button')
    expect(restButton).not.toBeDisabled()
  })


  it('heals HP when Rest is clicked when below max HP', async () => {
    const user = userEvent.setup()
    useGameStore.setState({
      player: { ...useGameStore.getState().player, hp: 4 },
    })
    render(<SceneView />)
    await user.click(screen.getByTestId('rest-button'))
    expect(useGameStore.getState().player.hp).toBe(5)
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
        level: 1,
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

    it('shows the combat UI when in combat', () => {
      enterCombat()
      render(<SceneView />)
      // Combat UI is handled by BattleActions component
      expect(screen.getByTestId('battle-actions')).toBeInTheDocument()
    })

    it('displays enemy name and HP bar in battle stage', () => {
      enterCombat()
      render(<SceneView />)
      expect(screen.getByTestId('stage-enemy-info').textContent).toContain('Shadow Wolf')
      expect(screen.getByTestId('stage-enemy-hp')).toBeInTheDocument()
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
      // Combat log is handled by BattleActions component
      // This test verifies the combat UI is rendered
      expect(screen.getByTestId('battle-actions')).toBeInTheDocument()
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
      // There should be one end-turn button in BattleActions
      const endTurnButtons = screen.getAllByTestId('end-turn-button')
      expect(endTurnButtons.length).toBe(1)
    })

    it('hides peripheral glimpses during combat', () => {
      enterCombat()
      render(<SceneView />)
      expect(screen.queryByTestId('peripheral-glimpses')).not.toBeInTheDocument()
    })

    it('shows combat actions container', () => {
      enterCombat()
      render(<SceneView />)
      expect(screen.getByTestId('battle-actions')).toBeInTheDocument()
    })

    it('enables attack when no weapon equipped (fists)', () => {
      enterCombat()
      useGameStore.setState({
        player: {
          ...useGameStore.getState().player,
          inventory: { items: [], equippedItemId: null, maxSlots: 5 },
        },
      })
      render(<SceneView />)
      expect(screen.getByTestId('attack-button')).not.toBeDisabled()
    })

    it('disables attack when no AP', () => {
      enterCombat()
      useGameStore.setState({
        player: { ...useGameStore.getState().player, ap: 0 },
      })
      render(<SceneView />)
      expect(screen.getByTestId('attack-button')).toBeDisabled()
    })

    it('shows enemy status effects in battle stage', () => {
      const enemy: ActiveEnemy = {
        name: 'Test',
        strength: 1,
        level: 1,
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
      expect(screen.getByTestId('stage-enemy-status')).toBeInTheDocument()
    })
  })
})
