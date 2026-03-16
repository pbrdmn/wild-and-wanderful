import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SkillsView } from '../../src/components/SkillsView'
import { useGameStore } from '../../src/stores/gameStore'

function initAndSkipIntro(seed: number) {
  useGameStore.getState().initGame(seed)
  const { offeredItems } = useGameStore.getState()
  if (offeredItems.length > 0) {
    useGameStore.getState().selectItem(offeredItems[0].id)
  }
}

describe('SkillsView', () => {
  const TEST_SEED = 42

  beforeEach(() => {
    initAndSkipIntro(TEST_SEED)
    useGameStore.getState().setView('skills')
  })

  it('renders the skills title', () => {
    render(<SkillsView />)
    expect(screen.getByText('Skills')).toBeInTheDocument()
  })

  it('shows active slot count', () => {
    render(<SkillsView />)
    const slotCount = screen.getByTestId('active-slot-count')
    expect(slotCount.textContent).toContain('1/2')
  })

  it('has a close button that returns to scene', async () => {
    const user = userEvent.setup()
    render(<SkillsView />)
    await user.click(screen.getByTestId('close-skills-button'))
    expect(useGameStore.getState().view).toBe('scene')
  })

  it('shows all 3 category groups', () => {
    render(<SkillsView />)
    expect(screen.getByTestId('category-melee')).toBeInTheDocument()
    expect(screen.getByTestId('category-ranged')).toBeInTheDocument()
    expect(screen.getByTestId('category-magic')).toBeInTheDocument()
  })

  it('shows skill cards for each skill', () => {
    render(<SkillsView />)
    expect(screen.getByTestId('skill-card-heavy-strike')).toBeInTheDocument()
    expect(screen.getByTestId('skill-card-arcane-bolt')).toBeInTheDocument()
    expect(screen.getByTestId('skill-card-precision-shot')).toBeInTheDocument()
  })

  it('locked skills are disabled', () => {
    render(<SkillsView />)
    const card = screen.getByTestId('skill-card-heavy-strike')
    expect(card).toBeDisabled()
  })

  it('unlocked skills can be toggled active', async () => {
    const user = userEvent.setup()
    useGameStore.getState().unlockSkill('heavy-strike')
    render(<SkillsView />)

    const card = screen.getByTestId('skill-card-heavy-strike')
    expect(card).not.toBeDisabled()
    await user.click(card)

    expect(useGameStore.getState().player.activeSkillIds).toContain('heavy-strike')
  })

  it('active skills can be deactivated', async () => {
    const user = userEvent.setup()
    useGameStore.getState().unlockSkill('heavy-strike')
    useGameStore.getState().setActiveSkills(['heavy-strike'])
    render(<SkillsView />)

    await user.click(screen.getByTestId('skill-card-heavy-strike'))
    expect(useGameStore.getState().player.activeSkillIds).not.toContain('heavy-strike')
  })

  it('respects maxActiveSkills limit', async () => {
    const user = userEvent.setup()
    useGameStore.getState().unlockSkill('heavy-strike')
    useGameStore.getState().unlockSkill('parry')
    useGameStore.getState().unlockSkill('daze-slam')
    useGameStore.getState().setActiveSkills(['heavy-strike', 'parry'])
    render(<SkillsView />)

    await user.click(screen.getByTestId('skill-card-daze-slam'))
    expect(useGameStore.getState().player.activeSkillIds).toHaveLength(2)
    expect(useGameStore.getState().player.activeSkillIds).not.toContain('daze-slam')
  })

  it('updates active slot count when toggling', async () => {
    const user = userEvent.setup()
    useGameStore.getState().unlockSkill('heavy-strike')

    const { unmount } = render(<SkillsView />)
    await user.click(screen.getByTestId('skill-card-heavy-strike'))
    unmount()

    render(<SkillsView />)
    expect(screen.getByTestId('active-slot-count').textContent).toContain('2/2')
  })
})
