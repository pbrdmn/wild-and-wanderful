import { describe, it, expect, beforeEach } from 'vitest'
import { generateHeirloomChoices, getHeirloomPool, resetItemIdCounter } from '../../src/engine/items'
import { ItemCategory } from '../../src/engine/types'
import { createRng } from '../../src/engine/random'

describe('generateHeirloomChoices', () => {
  beforeEach(() => {
    resetItemIdCounter()
  })

  it('returns exactly 3 items', () => {
    const rng = createRng(42)
    const choices = generateHeirloomChoices(rng)
    expect(choices).toHaveLength(3)
  })

  it('returns one item per category (melee, ranged, magic)', () => {
    const rng = createRng(42)
    const choices = generateHeirloomChoices(rng)
    const categories = choices.map((c) => c.category).sort()
    expect(categories).toEqual([ItemCategory.Magic, ItemCategory.Melee, ItemCategory.Ranged])
  })

  it('assigns unique IDs to each item', () => {
    const rng = createRng(42)
    const choices = generateHeirloomChoices(rng)
    const ids = new Set(choices.map((c) => c.id))
    expect(ids.size).toBe(3)
  })

  it('generates IDs with heirloom- prefix', () => {
    const rng = createRng(42)
    const choices = generateHeirloomChoices(rng)
    choices.forEach((c) => {
      expect(c.id).toMatch(/^heirloom-\d+$/)
    })
  })

  it('every item has required fields', () => {
    const rng = createRng(42)
    const choices = generateHeirloomChoices(rng)
    choices.forEach((item) => {
      expect(item.name).toBeTruthy()
      expect(item.description).toBeTruthy()
      expect(item.flavourText).toBeTruthy()
      expect(item.attackPower).toBeGreaterThan(0)
    })
  })

  it('produces deterministic results with the same seed', () => {
    const choices1 = generateHeirloomChoices(createRng(99))
    resetItemIdCounter()
    const choices2 = generateHeirloomChoices(createRng(99))
    expect(choices1.map((c) => c.name)).toEqual(choices2.map((c) => c.name))
  })

  it('produces different results with different seeds', () => {
    const names1 = generateHeirloomChoices(createRng(1)).map((c) => c.name)
    resetItemIdCounter()
    const names2 = generateHeirloomChoices(createRng(9999)).map((c) => c.name)
    const allSame = names1.every((n, i) => n === names2[i])
    expect(allSame).toBe(false)
  })

  it('melee items have higher attack power than magic items', () => {
    const rng = createRng(42)
    const choices = generateHeirloomChoices(rng)
    const melee = choices.find((c) => c.category === ItemCategory.Melee)!
    const magic = choices.find((c) => c.category === ItemCategory.Magic)!
    expect(melee.attackPower).toBeGreaterThan(magic.attackPower)
  })
})

describe('getHeirloomPool', () => {
  it('returns items for each category', () => {
    expect(getHeirloomPool(ItemCategory.Melee).length).toBeGreaterThan(0)
    expect(getHeirloomPool(ItemCategory.Ranged).length).toBeGreaterThan(0)
    expect(getHeirloomPool(ItemCategory.Magic).length).toBeGreaterThan(0)
  })

  it('returns empty array for unknown category', () => {
    expect(getHeirloomPool('unknown')).toEqual([])
  })
})
