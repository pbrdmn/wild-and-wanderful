import type { Item } from './types'
import { ItemCategory } from './types'
import { pickRandom } from './random'

const MELEE_HEIRLOOMS: readonly Omit<Item, 'id'>[] = [
  {
    name: 'Bramblewood Sword',
    category: ItemCategory.Melee,
    description: 'A sturdy blade carved from an ancient bramblewood tree.',
    attackPower: 3,
    flavourText: 'Its edge hums faintly when danger is near.',
  },
  {
    name: 'Acorn Cleaver',
    category: ItemCategory.Melee,
    description: 'A hefty cleaver forged by the badger smiths of Millhollow.',
    attackPower: 3,
    flavourText: 'Smells faintly of roasted chestnuts and iron.',
  },
  {
    name: 'Thistlethorn Sabre',
    category: ItemCategory.Melee,
    description: 'A curved sabre with a guard shaped like intertwined thistles.',
    attackPower: 3,
    flavourText: 'Light enough to carry, sharp enough to matter.',
  },
]

const RANGED_HEIRLOOMS: readonly Omit<Item, 'id'>[] = [
  {
    name: 'Thornwood Bow',
    category: ItemCategory.Ranged,
    description: 'A short bow of polished thornwood, strung with spider-silk.',
    attackPower: 2,
    flavourText: 'Arrows fly true even on the windiest days.',
  },
  {
    name: 'Pinecone Sling',
    category: ItemCategory.Ranged,
    description: 'A well-worn sling that launches pinecones with surprising force.',
    attackPower: 2,
    flavourText: 'Every forest clearing is an armoury.',
  },
  {
    name: 'Willowbark Longbow',
    category: ItemCategory.Ranged,
    description: 'A graceful longbow shaped from a fallen willow branch.',
    attackPower: 2,
    flavourText: 'Its draw is gentle, but its reach is not.',
  },
]

const MAGIC_HEIRLOOMS: readonly Omit<Item, 'id'>[] = [
  {
    name: 'Ember Wand',
    category: ItemCategory.Magic,
    description: 'A gnarled wand that glows with a warm inner light.',
    attackPower: 1,
    flavourText: 'The ember at its tip never goes out — not even in rain.',
  },
  {
    name: 'Moonpetal Staff',
    category: ItemCategory.Magic,
    description: 'A slender staff crowned with a luminous moonpetal blossom.',
    attackPower: 1,
    flavourText: 'In darkness it blooms; in danger, it shines.',
  },
  {
    name: 'Dewdrop Charm',
    category: ItemCategory.Magic,
    description: 'A small crystal charm that hovers just above your palm.',
    attackPower: 1,
    flavourText: 'It whispers the names of things long forgotten.',
  },
]

const HEIRLOOM_POOLS: Record<string, readonly Omit<Item, 'id'>[]> = {
  [ItemCategory.Melee]: MELEE_HEIRLOOMS,
  [ItemCategory.Ranged]: RANGED_HEIRLOOMS,
  [ItemCategory.Magic]: MAGIC_HEIRLOOMS,
}

let nextId = 1

export function generateHeirloomChoices(rng: () => number): [Item, Item, Item] {
  const melee: Item = { ...pickRandom(rng, MELEE_HEIRLOOMS), id: `heirloom-${nextId++}` }
  const ranged: Item = { ...pickRandom(rng, RANGED_HEIRLOOMS), id: `heirloom-${nextId++}` }
  const magic: Item = { ...pickRandom(rng, MAGIC_HEIRLOOMS), id: `heirloom-${nextId++}` }
  return [melee, ranged, magic]
}

export function getHeirloomPool(category: string): readonly Omit<Item, 'id'>[] {
  return HEIRLOOM_POOLS[category] ?? []
}

export function resetItemIdCounter(): void {
  nextId = 1
}
