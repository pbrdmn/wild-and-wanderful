import { describe, it, expect } from 'vitest'
import {
  SKILL_REGISTRY,
  getSkillById,
  getAvailableSkills,
  canUseSkill,
  unlockSkill,
  setActiveSkills,
  createDefaultSkillState,
} from '../../src/engine/skills'
import type { Player, Item } from '../../src/engine/types'
import { ItemCategory, DEFAULT_MAX_AP } from '../../src/engine/types'

function makeItem(overrides: Partial<Item> = {}): Item {
  return {
    id: 'item-1',
    name: 'Test Sword',
    category: ItemCategory.Melee,
    description: 'A test weapon.',
    attackPower: 3,
    flavourText: 'For testing only.',
    maxUses: 20,
    currentUses: 20,
    isConsumable: true,
    ...overrides,
  }
}

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    x: 0, y: 0,
    ap: DEFAULT_MAX_AP, maxAp: DEFAULT_MAX_AP,
    name: 'Test', species: 'fox', level: 1, xp: 0,
    wounds: 0, maxWounds: 1,
    inventory: { items: [], equippedItemId: null, maxSlots: 5 },
    unlockedSkillIds: [], activeSkillIds: [], maxActiveSkills: 2,
    ...overrides,
  }
}

describe('SKILL_REGISTRY', () => {
  it('contains 10 skills', () => {
    expect(SKILL_REGISTRY).toHaveLength(10)
  })

  it('has 3 skills per item category', () => {
    const melee = SKILL_REGISTRY.filter((s) => s.requiredItemCategory === 'melee')
    const ranged = SKILL_REGISTRY.filter((s) => s.requiredItemCategory === 'ranged')
    const magic = SKILL_REGISTRY.filter((s) => s.requiredItemCategory === 'magic')
    expect(melee).toHaveLength(3)
    expect(ranged).toHaveLength(3)
    expect(magic).toHaveLength(3)
  })

  it('every skill has a unique id', () => {
    const ids = SKILL_REGISTRY.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('getSkillById', () => {
  it('returns a skill by id', () => {
    const skill = getSkillById('heavy-strike')
    expect(skill).toBeDefined()
    expect(skill!.name).toBe('Heavy Strike')
  })

  it('returns undefined for unknown id', () => {
    expect(getSkillById('nonexistent')).toBeUndefined()
  })
})

describe('getAvailableSkills', () => {
  it('returns active skills matching the equipped item category', () => {
    const sword = makeItem({ id: 'sword-1', category: ItemCategory.Melee })
    const player = makePlayer({
      inventory: { items: [sword], equippedItemId: 'sword-1', maxSlots: 5 },
      unlockedSkillIds: ['heavy-strike', 'arcane-bolt'],
      activeSkillIds: ['heavy-strike', 'arcane-bolt'],
    })
    const available = getAvailableSkills(player)
    expect(available).toHaveLength(1)
    expect(available[0].id).toBe('heavy-strike')
  })

  it('returns empty when nothing is equipped', () => {
    const player = makePlayer({
      unlockedSkillIds: ['heavy-strike'],
      activeSkillIds: ['heavy-strike'],
    })
    expect(getAvailableSkills(player)).toHaveLength(0)
  })
})

describe('canUseSkill', () => {
  it('returns true when conditions are met', () => {
    const sword = makeItem({ id: 'sword-1', category: ItemCategory.Melee })
    const player = makePlayer({
      inventory: { items: [sword], equippedItemId: 'sword-1', maxSlots: 5 },
      unlockedSkillIds: ['heavy-strike'],
      activeSkillIds: ['heavy-strike'],
    })
    expect(canUseSkill(player, 'heavy-strike')).toBe(true)
  })

  it('returns false when skill is not active', () => {
    const sword = makeItem({ id: 'sword-1', category: ItemCategory.Melee })
    const player = makePlayer({
      inventory: { items: [sword], equippedItemId: 'sword-1', maxSlots: 5 },
      unlockedSkillIds: ['heavy-strike'],
      activeSkillIds: [],
    })
    expect(canUseSkill(player, 'heavy-strike')).toBe(false)
  })

  it('returns false when AP is insufficient', () => {
    const sword = makeItem({ id: 'sword-1', category: ItemCategory.Melee })
    const player = makePlayer({
      ap: 1,
      inventory: { items: [sword], equippedItemId: 'sword-1', maxSlots: 5 },
      unlockedSkillIds: ['heavy-strike'],
      activeSkillIds: ['heavy-strike'],
    })
    expect(canUseSkill(player, 'heavy-strike')).toBe(false)
  })

  it('returns false when wrong item category is equipped', () => {
    const bow = makeItem({ id: 'bow-1', category: ItemCategory.Ranged })
    const player = makePlayer({
      inventory: { items: [bow], equippedItemId: 'bow-1', maxSlots: 5 },
      unlockedSkillIds: ['heavy-strike'],
      activeSkillIds: ['heavy-strike'],
    })
    expect(canUseSkill(player, 'heavy-strike')).toBe(false)
  })

  it('returns false for unknown skill', () => {
    const player = makePlayer()
    expect(canUseSkill(player, 'nonexistent')).toBe(false)
  })
})

describe('unlockSkill', () => {
  it('adds the skill to unlockedSkillIds', () => {
    const player = makePlayer()
    const result = unlockSkill(player, 'heavy-strike')
    expect(result.success).toBe(true)
    expect(result.player.unlockedSkillIds).toContain('heavy-strike')
  })

  it('fails if skill is already unlocked', () => {
    const player = makePlayer({ unlockedSkillIds: ['heavy-strike'] })
    const result = unlockSkill(player, 'heavy-strike')
    expect(result.success).toBe(false)
  })

  it('fails for unknown skill', () => {
    const player = makePlayer()
    const result = unlockSkill(player, 'nonexistent')
    expect(result.success).toBe(false)
  })

  it('does not mutate the original player', () => {
    const player = makePlayer()
    unlockSkill(player, 'heavy-strike')
    expect(player.unlockedSkillIds).toHaveLength(0)
  })
})

describe('setActiveSkills', () => {
  it('sets active skills from unlocked skills', () => {
    const player = makePlayer({
      unlockedSkillIds: ['heavy-strike', 'parry'],
    })
    const result = setActiveSkills(player, ['heavy-strike', 'parry'])
    expect(result.success).toBe(true)
    expect(result.player.activeSkillIds).toEqual(['heavy-strike', 'parry'])
  })

  it('fails when exceeding maxActiveSkills', () => {
    const player = makePlayer({
      unlockedSkillIds: ['heavy-strike', 'parry', 'daze-slam'],
      maxActiveSkills: 2,
    })
    const result = setActiveSkills(player, ['heavy-strike', 'parry', 'daze-slam'])
    expect(result.success).toBe(false)
    expect(result.reason).toContain('2')
  })

  it('fails when a skill is not unlocked', () => {
    const player = makePlayer({ unlockedSkillIds: ['heavy-strike'] })
    const result = setActiveSkills(player, ['heavy-strike', 'parry'])
    expect(result.success).toBe(false)
    expect(result.reason).toContain('not unlocked')
  })

  it('fails for unknown skill id', () => {
    const player = makePlayer({ unlockedSkillIds: ['heavy-strike'] })
    const result = setActiveSkills(player, ['nonexistent'])
    expect(result.success).toBe(false)
  })

  it('does not mutate the original player', () => {
    const player = makePlayer({ unlockedSkillIds: ['heavy-strike'] })
    setActiveSkills(player, ['heavy-strike'])
    expect(player.activeSkillIds).toHaveLength(0)
  })
})

describe('createDefaultSkillState', () => {
  it('returns empty skill state with default max', () => {
    const state = createDefaultSkillState()
    expect(state.unlockedSkillIds).toEqual([])
    expect(state.activeSkillIds).toEqual([])
    expect(state.maxActiveSkills).toBe(2)
  })
})
