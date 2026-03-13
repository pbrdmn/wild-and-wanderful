import { describe, it, expect } from 'vitest'
import { rest } from '../../src/engine/rest'
import type { Player } from '../../src/engine/types'
import { DEFAULT_MAX_AP, AP_COST_REST } from '../../src/engine/types'
import { createRng } from '../../src/engine/random'

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    x: 5, y: 5,
    ap: DEFAULT_MAX_AP, maxAp: DEFAULT_MAX_AP,
    name: 'Test', level: 1,
    wounds: 0, maxWounds: 1,
    inventory: { items: [], equippedItemId: null, maxSlots: 5 },
    ...overrides,
  }
}

function makeRngReturning(values: number[]): () => number {
  let i = 0
  return () => values[i++] ?? 0
}

describe('rest', () => {
  it('deducts AP on successful rest', () => {
    const player = makePlayer()
    const rng = makeRngReturning([0.5])
    const result = rest(player, rng)
    expect(result.success).toBe(true)
    expect(result.player.ap).toBe(DEFAULT_MAX_AP - AP_COST_REST)
  })

  it('fails when player has insufficient AP', () => {
    const player = makePlayer({ ap: 0 })
    const rng = makeRngReturning([0.5])
    const result = rest(player, rng)
    expect(result.success).toBe(false)
    expect(result.reason).toContain('AP')
    expect(result.player.ap).toBe(0)
  })

  it('heals one wound when player is wounded', () => {
    const player = makePlayer({ wounds: 1, maxWounds: 2 })
    const rng = makeRngReturning([0.5])
    const result = rest(player, rng)
    expect(result.success).toBe(true)
    expect(result.woundHealed).toBe(true)
    expect(result.player.wounds).toBe(0)
  })

  it('does not heal when player has no wounds', () => {
    const player = makePlayer({ wounds: 0 })
    const rng = makeRngReturning([0.5])
    const result = rest(player, rng)
    expect(result.success).toBe(true)
    expect(result.woundHealed).toBe(false)
    expect(result.player.wounds).toBe(0)
  })

  it('triggers an ambush when rng roll is below AMBUSH_CHANCE', () => {
    const player = makePlayer()
    // First rng call: ambush roll (0.05 < 0.1), second: enemy pick
    const rng = makeRngReturning([0.05, 0.0])
    const result = rest(player, rng)
    expect(result.success).toBe(true)
    expect(result.ambushed).toBe(true)
    expect(result.enemy).toBeDefined()
    expect(result.enemy!.hasInitiative).toBe(true)
    expect(result.enemy!.name).toBeTruthy()
    expect(result.enemy!.strength).toBeGreaterThan(0)
  })

  it('does not trigger ambush when roll is above AMBUSH_CHANCE', () => {
    const player = makePlayer()
    const rng = makeRngReturning([0.5])
    const result = rest(player, rng)
    expect(result.ambushed).toBe(false)
    expect(result.enemy).toBeUndefined()
  })

  it('heals wound before ambush check (wound still healed even if ambushed)', () => {
    const player = makePlayer({ wounds: 1, maxWounds: 2 })
    const rng = makeRngReturning([0.05, 0.0])
    const result = rest(player, rng)
    expect(result.woundHealed).toBe(true)
    expect(result.player.wounds).toBe(0)
    expect(result.ambushed).toBe(true)
  })

  it('does not mutate the original player', () => {
    const player = makePlayer({ wounds: 1 })
    const rng = makeRngReturning([0.5])
    rest(player, rng)
    expect(player.ap).toBe(DEFAULT_MAX_AP)
    expect(player.wounds).toBe(1)
  })

  it('works with seeded RNG for deterministic results', () => {
    const player = makePlayer()
    const rng1 = createRng(999)
    const rng2 = createRng(999)
    const result1 = rest(player, rng1)
    const result2 = rest(player, rng2)
    expect(result1.ambushed).toBe(result2.ambushed)
    expect(result1.woundHealed).toBe(result2.woundHealed)
  })
})
