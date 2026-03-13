import { describe, it, expect } from 'vitest'
import {
  playerBasicAttack,
  playerSkillAttack,
  enemyTurn,
  attemptFlee,
  tickStatusEffects,
  getCombatOutcome,
} from '../../src/engine/combat'
import type { Player, ActiveEnemy, Item, Skill, StatusEffect } from '../../src/engine/types'
import { ItemCategory, DEFAULT_MAX_AP, AP_COST_ATTACK } from '../../src/engine/types'

function makeItem(overrides: Partial<Item> = {}): Item {
  return {
    id: 'sword-1',
    name: 'Test Sword',
    category: ItemCategory.Melee,
    description: 'A test weapon.',
    attackPower: 3,
    flavourText: 'For testing only.',
    ...overrides,
  }
}

function makePlayer(overrides: Partial<Player> = {}): Player {
  const sword = makeItem()
  return {
    x: 0, y: 0,
    ap: DEFAULT_MAX_AP, maxAp: DEFAULT_MAX_AP,
    name: 'Test', species: 'fox', level: 1, xp: 0,
    wounds: 0, maxWounds: 3,
    inventory: { items: [sword], equippedItemId: 'sword-1', maxSlots: 5 },
    unlockedSkillIds: [], activeSkillIds: [], maxActiveSkills: 2,
    ...overrides,
  }
}

function makeEnemy(overrides: Partial<ActiveEnemy> = {}): ActiveEnemy {
  return {
    name: 'Test Enemy',
    strength: 1,
    hp: 3,
    maxHp: 3,
    hasInitiative: false,
    statusEffects: [],
    ...overrides,
  }
}

function makeRng(values: number[]): () => number {
  let i = 0
  return () => values[i++] ?? 0
}

describe('getCombatOutcome', () => {
  it('returns victory when enemy HP is 0', () => {
    expect(getCombatOutcome(makePlayer(), makeEnemy({ hp: 0 }))).toBe('victory')
  })

  it('returns defeat when player wounds reach max', () => {
    expect(getCombatOutcome(makePlayer({ wounds: 3, maxWounds: 3 }), makeEnemy())).toBe('defeat')
  })

  it('returns ongoing otherwise', () => {
    expect(getCombatOutcome(makePlayer(), makeEnemy())).toBe('ongoing')
  })
})

describe('playerBasicAttack', () => {
  it('deals damage equal to equipped weapon attackPower', () => {
    const player = makePlayer()
    const enemy = makeEnemy({ hp: 5 })
    const result = playerBasicAttack(player, enemy)
    expect(result.success).toBe(true)
    expect(result.enemy.hp).toBe(2) // 5 - 3
    expect(result.player.ap).toBe(DEFAULT_MAX_AP - AP_COST_ATTACK)
    expect(result.messages.length).toBeGreaterThan(0)
  })

  it('does not reduce HP below 0', () => {
    const enemy = makeEnemy({ hp: 1 })
    const result = playerBasicAttack(makePlayer(), enemy)
    expect(result.enemy.hp).toBe(0)
  })

  it('fails when player has no AP', () => {
    const player = makePlayer({ ap: 0 })
    const result = playerBasicAttack(player, makeEnemy())
    expect(result.success).toBe(false)
    expect(result.reason).toContain('AP')
  })

  it('fails when no weapon is equipped', () => {
    const player = makePlayer({
      inventory: { items: [], equippedItemId: null, maxSlots: 5 },
    })
    const result = playerBasicAttack(player, makeEnemy())
    expect(result.success).toBe(false)
    expect(result.reason).toContain('weapon')
  })

  it('reports victory message when enemy is defeated', () => {
    const result = playerBasicAttack(makePlayer(), makeEnemy({ hp: 1 }))
    expect(result.enemy.hp).toBe(0)
    expect(result.messages.some((m) => m.includes('defeated'))).toBe(true)
  })

  it('does not mutate original objects', () => {
    const player = makePlayer()
    const enemy = makeEnemy()
    playerBasicAttack(player, enemy)
    expect(player.ap).toBe(DEFAULT_MAX_AP)
    expect(enemy.hp).toBe(3)
  })
})

describe('playerSkillAttack', () => {
  const damageSkill: Skill = {
    id: 'test-damage',
    name: 'Heavy Strike',
    description: 'Test',
    skillCategory: 'offensive',
    requiredItemCategory: ItemCategory.Melee,
    apCost: 2,
    effect: { type: 'damage', power: 5 },
  }

  const dazeSkill: Skill = {
    id: 'test-daze',
    name: 'Daze Slam',
    description: 'Test',
    skillCategory: 'offensive',
    requiredItemCategory: ItemCategory.Melee,
    apCost: 2,
    effect: { type: 'damage_status', power: 3, statusEffect: 'daze', duration: 1 },
  }

  const poisonSkill: Skill = {
    id: 'test-poison',
    name: 'Hex',
    description: 'Test',
    skillCategory: 'utility',
    requiredItemCategory: ItemCategory.Magic,
    apCost: 1,
    effect: { type: 'status', statusEffect: 'poison', duration: 3 },
  }

  it('deals skill damage and deducts AP', () => {
    const result = playerSkillAttack(makePlayer(), makeEnemy({ hp: 10 }), damageSkill)
    expect(result.success).toBe(true)
    expect(result.enemy.hp).toBe(5)
    expect(result.player.ap).toBe(DEFAULT_MAX_AP - 2)
  })

  it('applies status effect with damage_status', () => {
    const result = playerSkillAttack(makePlayer(), makeEnemy({ hp: 10 }), dazeSkill)
    expect(result.success).toBe(true)
    expect(result.enemy.statusEffects).toEqual([{ type: 'daze', remainingTurns: 1 }])
  })

  it('applies status-only skill to enemy', () => {
    const wand = makeItem({ id: 'wand-1', category: ItemCategory.Magic, attackPower: 1 })
    const player = makePlayer({
      inventory: { items: [wand], equippedItemId: 'wand-1', maxSlots: 5 },
    })
    const result = playerSkillAttack(player, makeEnemy(), poisonSkill)
    expect(result.success).toBe(true)
    expect(result.enemy.statusEffects).toEqual([{ type: 'poison', remainingTurns: 3 }])
  })

  it('fails when AP is insufficient', () => {
    const player = makePlayer({ ap: 1 })
    const result = playerSkillAttack(player, makeEnemy(), damageSkill)
    expect(result.success).toBe(false)
  })

  it('fails when wrong item category is equipped', () => {
    const bow = makeItem({ id: 'bow-1', category: ItemCategory.Ranged })
    const player = makePlayer({
      inventory: { items: [bow], equippedItemId: 'bow-1', maxSlots: 5 },
    })
    const result = playerSkillAttack(player, makeEnemy(), damageSkill)
    expect(result.success).toBe(false)
  })
})

describe('enemyTurn', () => {
  it('inflicts 1 wound on the player', () => {
    const result = enemyTurn(makeEnemy({ strength: 1 }), makePlayer())
    expect(result.player.wounds).toBe(1)
    expect(result.messages.some((m) => m.includes('wound'))).toBe(true)
  })

  it('skips attack when enemy is dazed', () => {
    const enemy = makeEnemy({
      statusEffects: [{ type: 'daze', remainingTurns: 1 }],
    })
    const result = enemyTurn(enemy, makePlayer())
    expect(result.player.wounds).toBe(0)
    expect(result.messages.some((m) => m.includes('dazed'))).toBe(true)
  })

  it('decrements status effect durations', () => {
    const enemy = makeEnemy({
      statusEffects: [{ type: 'daze', remainingTurns: 2 }],
    })
    const result = enemyTurn(enemy, makePlayer())
    expect(result.enemy.statusEffects).toEqual([{ type: 'daze', remainingTurns: 1 }])
  })

  it('removes expired status effects', () => {
    const enemy = makeEnemy({
      statusEffects: [{ type: 'daze', remainingTurns: 1 }],
    })
    const result = enemyTurn(enemy, makePlayer())
    expect(result.enemy.statusEffects).toHaveLength(0)
  })

  it('applies poison damage to enemy at start of turn', () => {
    const enemy = makeEnemy({
      hp: 3,
      statusEffects: [{ type: 'poison', remainingTurns: 2 }],
    })
    const result = enemyTurn(enemy, makePlayer())
    expect(result.enemy.hp).toBe(2) // poison deals 1
    expect(result.messages.some((m) => m.includes('poison'))).toBe(true)
  })

  it('absorbs damage when player has shield', () => {
    const result = enemyTurn(makeEnemy(), makePlayer(), 0, true)
    expect(result.player.wounds).toBe(0)
    expect(result.messages.some((m) => m.includes('shield'))).toBe(true)
  })

  it('reports overwhelmed when wounds reach max', () => {
    const player = makePlayer({ wounds: 2, maxWounds: 3 })
    const result = enemyTurn(makeEnemy(), player)
    expect(result.player.wounds).toBe(3)
    expect(result.messages.some((m) => m.includes('overwhelmed'))).toBe(true)
  })

  it('does not mutate original objects', () => {
    const player = makePlayer()
    const enemy = makeEnemy()
    enemyTurn(enemy, player)
    expect(player.wounds).toBe(0)
    expect(enemy.statusEffects).toEqual([])
  })
})

describe('attemptFlee', () => {
  it('succeeds when rng roll is below BASE_FLEE_CHANCE', () => {
    const rng = makeRng([0.1])
    const result = attemptFlee(makePlayer(), rng)
    expect(result.success).toBe(true)
    expect(result.fled).toBe(true)
    expect(result.player.ap).toBe(DEFAULT_MAX_AP - 1)
  })

  it('fails the flee when roll is above BASE_FLEE_CHANCE', () => {
    const rng = makeRng([0.9])
    const result = attemptFlee(makePlayer(), rng)
    expect(result.success).toBe(true)
    expect(result.fled).toBe(false)
    expect(result.player.ap).toBe(DEFAULT_MAX_AP - 1)
  })

  it('fails entirely when not enough AP', () => {
    const player = makePlayer({ ap: 0 })
    const rng = makeRng([0.1])
    const result = attemptFlee(player, rng)
    expect(result.success).toBe(false)
    expect(result.fled).toBe(false)
  })

  it('does not mutate original player', () => {
    const player = makePlayer()
    const rng = makeRng([0.1])
    attemptFlee(player, rng)
    expect(player.ap).toBe(DEFAULT_MAX_AP)
  })
})

describe('tickStatusEffects', () => {
  it('decrements remaining turns', () => {
    const effects: StatusEffect[] = [{ type: 'poison', remainingTurns: 3 }]
    const result = tickStatusEffects(effects)
    expect(result).toEqual([{ type: 'poison', remainingTurns: 2 }])
  })

  it('removes effects with 0 remaining turns', () => {
    const effects: StatusEffect[] = [{ type: 'daze', remainingTurns: 1 }]
    const result = tickStatusEffects(effects)
    expect(result).toHaveLength(0)
  })

  it('does not mutate the original array', () => {
    const effects: StatusEffect[] = [{ type: 'poison', remainingTurns: 2 }]
    tickStatusEffects(effects)
    expect(effects[0].remainingTurns).toBe(2)
  })
})
