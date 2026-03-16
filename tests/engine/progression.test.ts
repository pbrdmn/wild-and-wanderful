import { describe, it, expect } from 'vitest'
import {
  calculateXpReward,
  getLevel,
  getLevelRewards,
  applyLevelUp,
  checkLevelUp,
} from '../../src/engine/progression'
import type { Player, ActiveEnemy } from '../../src/engine/types'
import { DEFAULT_MAX_AP } from '../../src/engine/types'

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    x: 0, y: 0,
    ap: DEFAULT_MAX_AP, maxAp: DEFAULT_MAX_AP,
    name: 'Test', species: 'fox', level: 1, xp: 0,
    hp: 5, maxHp: 5,
    inventory: { items: [], equippedItemId: null, maxSlots: 5 },
    unlockedSkillIds: [], activeSkillIds: [], maxActiveSkills: 2,
    ...overrides,
  }
}

function makeEnemy(overrides: Partial<ActiveEnemy> = {}): ActiveEnemy {
  return {
    name: 'Wolf',
    strength: 1,
    level: 1,
    hp: 3,
    maxHp: 3,
    hasInitiative: false,
    statusEffects: [],
    ...overrides,
  }
}

describe('progression', () => {
  describe('calculateXpReward', () => {
    it('returns enemy level as XP', () => {
      expect(calculateXpReward(makeEnemy({ level: 3 }))).toBe(3)
    })

    it('returns 1 for a level 1 enemy', () => {
      expect(calculateXpReward(makeEnemy({ level: 1 }))).toBe(1)
    })
  })

  describe('getLevel', () => {
    it('returns level 1 for 0 XP', () => {
      expect(getLevel(0)).toBe(1)
    })

    it('returns level 2 at threshold', () => {
      expect(getLevel(3)).toBe(2)
    })

    it('returns level 3 at 8 XP', () => {
      expect(getLevel(8)).toBe(3)
    })

    it('returns level 5 at 25+ XP', () => {
      expect(getLevel(25)).toBe(5)
      expect(getLevel(100)).toBe(5)
    })

    it('returns correct level for values between thresholds', () => {
      expect(getLevel(2)).toBe(1)
      expect(getLevel(7)).toBe(2)
      expect(getLevel(14)).toBe(3)
      expect(getLevel(24)).toBe(4)
    })
  })

  describe('getLevelRewards', () => {
    it('returns correct rewards for each level', () => {
      expect(getLevelRewards(1)).toEqual({ maxHp: 5, maxActiveSkills: 2 })
      expect(getLevelRewards(2)).toEqual({ maxHp: 6, maxActiveSkills: 2 })
      expect(getLevelRewards(3)).toEqual({ maxHp: 7, maxActiveSkills: 3 })
      expect(getLevelRewards(4)).toEqual({ maxHp: 8, maxActiveSkills: 3 })
      expect(getLevelRewards(5)).toEqual({ maxHp: 9, maxActiveSkills: 4 })
    })
  })

  describe('checkLevelUp', () => {
    it('does not level up when XP is insufficient', () => {
      const player = makePlayer({ xp: 2, level: 1 })
      const result = checkLevelUp(player)
      expect(result.leveled).toBe(false)
      expect(result.newLevel).toBe(1)
    })

    it('levels up when XP reaches threshold', () => {
      const player = makePlayer({ xp: 3 })
      const result = checkLevelUp(player)
      expect(result.leveled).toBe(true)
      expect(result.newLevel).toBe(2)
      expect(result.player.level).toBe(2)
      expect(result.player.maxHp).toBe(6)
    })

    it('can jump multiple levels', () => {
      const player = makePlayer({ xp: 20 })
      const result = checkLevelUp(player)
      expect(result.leveled).toBe(true)
      expect(result.newLevel).toBe(4)
      expect(result.player.maxHp).toBe(8)
      expect(result.player.maxActiveSkills).toBe(3)
    })

    it('does not level past max', () => {
      const player = makePlayer({ xp: 100, level: 5 })
      const result = checkLevelUp(player)
      expect(result.leveled).toBe(false)
      expect(result.newLevel).toBe(5)
    })
  })

  describe('applyLevelUp', () => {
    it('updates player stats correctly', () => {
      const player = makePlayer({ level: 2, maxHp: 6, maxActiveSkills: 2 })
      const result = applyLevelUp(player, 3)
      expect(result.level).toBe(3)
      expect(result.maxHp).toBe(7)
      expect(result.maxActiveSkills).toBe(3)
    })
  })
})
