import { describe, it, expect } from 'vitest'
import { createLeaderboardEntry, sortLeaderboard, addToLeaderboard } from '../../src/engine/leaderboard'
import type { LeaderboardEntry, Player } from '../../src/engine/types'
import { MAX_LEADERBOARD_ENTRIES, DEFAULT_MAX_AP } from '../../src/engine/types'

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    x: 0, y: 0,
    ap: DEFAULT_MAX_AP, maxAp: DEFAULT_MAX_AP,
    name: 'Hero', species: 'fox', level: 3, xp: 10,
    wounds: 0, maxWounds: 3,
    inventory: { items: [], equippedItemId: null, maxSlots: 5 },
    unlockedSkillIds: [], activeSkillIds: [], maxActiveSkills: 2,
    ...overrides,
  }
}

function makeEntry(overrides: Partial<LeaderboardEntry> = {}): LeaderboardEntry {
  return {
    id: 'test-1',
    name: 'Hero',
    species: 'fox',
    level: 1,
    xp: 0,
    turnsSurvived: 10,
    questCompleted: false,
    equippedItemName: null,
    date: Date.now(),
    ...overrides,
  }
}

describe('leaderboard', () => {
  describe('createLeaderboardEntry', () => {
    it('creates an entry from player state', () => {
      const player = makePlayer({ name: 'Bramble', species: 'bear', level: 3, xp: 10 })
      const entry = createLeaderboardEntry(player, 25, true)
      expect(entry.name).toBe('Bramble')
      expect(entry.species).toBe('bear')
      expect(entry.level).toBe(3)
      expect(entry.xp).toBe(10)
      expect(entry.turnsSurvived).toBe(25)
      expect(entry.questCompleted).toBe(true)
      expect(entry.id).toBeTruthy()
    })

    it('captures equippedItemName when item is equipped', () => {
      const player = makePlayer({
        inventory: {
          items: [{ id: 'w1', name: 'Magic Staff', category: 'magic', description: '', attackPower: 5, flavourText: '' }],
          equippedItemId: 'w1',
          maxSlots: 5,
        },
      })
      const entry = createLeaderboardEntry(player, 10, false)
      expect(entry.equippedItemName).toBe('Magic Staff')
    })
  })

  describe('sortLeaderboard', () => {
    it('ranks quest completers above retirees', () => {
      const a = makeEntry({ id: 'a', questCompleted: false, level: 5 })
      const b = makeEntry({ id: 'b', questCompleted: true, level: 1 })
      const sorted = sortLeaderboard([a, b])
      expect(sorted[0].id).toBe('b')
    })

    it('sorts by level within same completion status', () => {
      const a = makeEntry({ id: 'a', level: 2 })
      const b = makeEntry({ id: 'b', level: 5 })
      const sorted = sortLeaderboard([a, b])
      expect(sorted[0].id).toBe('b')
    })

    it('sorts by XP when level is tied', () => {
      const a = makeEntry({ id: 'a', level: 3, xp: 10 })
      const b = makeEntry({ id: 'b', level: 3, xp: 14 })
      const sorted = sortLeaderboard([a, b])
      expect(sorted[0].id).toBe('b')
    })
  })

  describe('addToLeaderboard', () => {
    it('adds a new entry and sorts', () => {
      const existing = [makeEntry({ id: 'a', level: 1 })]
      const newEntry = makeEntry({ id: 'b', level: 5 })
      const result = addToLeaderboard(existing, newEntry)
      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('b')
    })

    it('caps at MAX_LEADERBOARD_ENTRIES', () => {
      const entries = Array.from({ length: MAX_LEADERBOARD_ENTRIES }, (_, i) =>
        makeEntry({ id: `e${i}`, level: 1, xp: i }),
      )
      const newEntry = makeEntry({ id: 'overflow', level: 1, xp: 999 })
      const result = addToLeaderboard(entries, newEntry)
      expect(result).toHaveLength(MAX_LEADERBOARD_ENTRIES)
      expect(result[0].id).toBe('overflow')
    })
  })
})
