import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BattleStage } from '../../src/components/BattleStage'
import type { ActiveEnemy, LegacyNpc } from '../../src/engine/types'

describe('BattleStage', () => {
  const baseProps = {
    terrain: 'forest' as const,
    playerSpecies: 'fox' as const,
    inCombat: false,
  }

  it('renders the stage container', () => {
    render(<BattleStage {...baseProps} />)
    expect(screen.getByTestId('battle-stage')).toBeInTheDocument()
  })

  it('renders the player sprite', () => {
    render(<BattleStage {...baseProps} />)
    expect(screen.getByTestId('player-sprite')).toBeInTheDocument()
  })

  it('does not show enemy sprite during exploration', () => {
    render(<BattleStage {...baseProps} />)
    expect(screen.queryByTestId('enemy-sprite')).not.toBeInTheDocument()
    expect(screen.queryByTestId('stage-enemy-info')).not.toBeInTheDocument()
  })

  it('shows enemy sprite and info during combat', () => {
    const enemy: ActiveEnemy = {
      name: 'Shadow Wolf',
      strength: 1,
      hp: 2,
      maxHp: 2,
      hasInitiative: false,
      statusEffects: [],
    }
    render(<BattleStage {...baseProps} inCombat activeEnemy={enemy} />)
    expect(screen.getByTestId('enemy-sprite')).toBeInTheDocument()
    expect(screen.getByTestId('stage-enemy-info')).toBeInTheDocument()
    expect(screen.getByTestId('stage-enemy-info').textContent).toContain('Shadow Wolf')
  })

  it('shows HP bar with correct values', () => {
    const enemy: ActiveEnemy = {
      name: 'Shadow Wolf',
      strength: 1,
      hp: 1,
      maxHp: 2,
      hasInitiative: false,
      statusEffects: [],
    }
    render(<BattleStage {...baseProps} inCombat activeEnemy={enemy} />)
    expect(screen.getByTestId('stage-enemy-hp').textContent).toContain('1/2')
  })

  it('shows enemy status effects', () => {
    const enemy: ActiveEnemy = {
      name: 'Shadow Wolf',
      strength: 1,
      hp: 2,
      maxHp: 2,
      hasInitiative: false,
      statusEffects: [{ type: 'poison', remainingTurns: 2 }],
    }
    render(<BattleStage {...baseProps} inCombat activeEnemy={enemy} />)
    expect(screen.getByTestId('stage-enemy-status')).toBeInTheDocument()
  })

  it('shows NPC sprite on legacy NPC tile during exploration', () => {
    const npc: LegacyNpc = {
      name: 'Old Fox',
      species: 'fox',
      level: 5,
      questCompleted: true,
      tileX: 3,
      tileY: 3,
    }
    render(<BattleStage {...baseProps} legacyNpc={npc} />)
    expect(screen.getByTestId('npc-sprite')).toBeInTheDocument()
  })

  it('does not show NPC sprite during combat', () => {
    const npc: LegacyNpc = {
      name: 'Old Fox',
      species: 'fox',
      level: 5,
      questCompleted: true,
      tileX: 3,
      tileY: 3,
    }
    const enemy: ActiveEnemy = {
      name: 'Shadow Wolf',
      strength: 1,
      hp: 2,
      maxHp: 2,
      hasInitiative: false,
      statusEffects: [],
    }
    render(<BattleStage {...baseProps} inCombat activeEnemy={enemy} legacyNpc={npc} />)
    expect(screen.queryByTestId('npc-sprite')).not.toBeInTheDocument()
    expect(screen.getByTestId('enemy-sprite')).toBeInTheDocument()
  })

  it('uses terrain-appropriate background', () => {
    render(<BattleStage {...baseProps} terrain="meadow" />)
    const bg = screen.getByTestId('battle-stage').querySelector('[class*="background"]')
    expect(bg).toBeInTheDocument()
  })
})
