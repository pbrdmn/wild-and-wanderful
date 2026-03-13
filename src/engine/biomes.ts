import type { Direction } from './types'
import { TerrainType } from './types'

export interface BiomeData {
  name: string
  descriptions: readonly string[]
  glimpses: readonly string[]
  symbol: string
}

const biomeData: Record<TerrainType, BiomeData> = {
  [TerrainType.Forest]: {
    name: 'Forest',
    descriptions: [
      'Tall oaks and ancient birches form a canopy overhead, dappling the ground in shifting patterns of light and shadow. The air smells of moss and pine needles.',
      'A quiet woodland stretches around you. Ferns carpet the forest floor, and somewhere a woodpecker taps out a steady rhythm against bark.',
      'The forest here is thick and old. Gnarled roots twist across the path, and mushrooms cluster at the base of every trunk.',
    ],
    glimpses: [
      'dense forest rises among the trees',
      'a canopy of green stretches onward',
      'ancient woodland awaits, dark and deep',
    ],
    symbol: '🌲',
  },
  [TerrainType.Meadow]: {
    name: 'Meadow',
    descriptions: [
      'A sunlit meadow opens before you, carpeted in wildflowers that sway in a gentle breeze. Butterflies drift lazily between blossoms.',
      'Rolling grasslands stretch out beneath an open sky. The tall grass ripples like waves, and the warm air hums with the sound of bees.',
      'A peaceful clearing opens up, bright with dandelions and clover. A soft breeze carries the scent of fresh hay.',
    ],
    glimpses: [
      'open meadows shimmer in the light',
      'golden grasslands roll gently',
      'wildflower fields sway in the breeze',
    ],
    symbol: '🌻',
  },
  [TerrainType.River]: {
    name: 'River',
    descriptions: [
      'A clear stream babbles over smooth stones, its banks lined with reeds and forget-me-nots. Dragonflies hover above the surface.',
      'The river bends here, carving through soft earth. Water striders dance on the surface, and the current carries fallen leaves downstream.',
      'Cool water rushes past, sparkling where sunlight catches the ripples. Smooth pebbles line the riverbed beneath the crystal flow.',
    ],
    glimpses: [
      'the glint of running water',
      'a river winds its way through the land',
      'flowing water catches the light ahead',
    ],
    symbol: '🏞️',
  },
  [TerrainType.Lake]: {
    name: 'Lake',
    descriptions: [
      'A still lake mirrors the sky, its surface broken only by the occasional ripple of a surfacing fish. Lily pads cluster near the shore.',
      'The lake stretches out, calm and deep. Tall rushes border its edges, and a heron stands motionless in the shallows.',
    ],
    glimpses: [
      'the still surface of a lake gleams',
      'calm waters stretch into the distance',
    ],
    symbol: '🌊',
  },
  [TerrainType.Road]: {
    name: 'Road',
    descriptions: [
      'A well-worn dirt path stretches ahead, packed firm by countless travellers. Wagon ruts mark its edges, and wildflowers grow between the tracks.',
      'The road here is broad and friendly, lined with low stone walls and the occasional signpost pointing to distant places.',
      'A pleasant country lane winds onward, its hard-packed earth easy on the feet. Hedgerows border it on either side.',
    ],
    glimpses: [
      'a worn path leads onward',
      'a road winds into the distance',
      'a travelled path stretches ahead',
    ],
    symbol: '🛤️',
  },
  [TerrainType.Village]: {
    name: 'Village',
    descriptions: [
      'Thatched-roof cottages cluster around a cobblestone square. Smoke curls from chimneys, and the smell of baking bread hangs in the air. Friendly faces peer from doorways.',
      'A small hamlet nestles in a sheltered hollow. A well stands in the centre of the green, and laundry flaps on lines strung between the houses.',
      'The village is warm and welcoming. Lanterns glow in windows, a blacksmith hammers at their forge, and somewhere a fiddle plays a cheerful tune.',
    ],
    glimpses: [
      'the thatched roofs of a village',
      'chimney smoke rises from a settlement',
      'the lights of a hamlet flicker warmly',
    ],
    symbol: '🏘️',
  },
  [TerrainType.Mountain]: {
    name: 'Mountain',
    descriptions: [
      'Jagged rocks and steep cliffs bar the way. The mountain rises sharply, its peak lost in the clouds. Eagles circle high above.',
      'A wall of stone towers before you, too steep and treacherous to climb without proper equipment. Wind howls through narrow crevices.',
    ],
    glimpses: [
      'impassable peaks loom against the sky',
      'a wall of mountain rock blocks the way',
    ],
    symbol: '⛰️',
  },
  [TerrainType.Swamp]: {
    name: 'Swamp',
    descriptions: [
      'Murky water pools between hummocks of soggy moss. The air is thick with mist and the buzzing of insects. Gnarled, half-drowned trees lean at odd angles.',
      'The ground turns soft and treacherous here. Bubbles rise from dark water, and the sour smell of decay hangs in the heavy air.',
    ],
    glimpses: [
      'murky swampland squelches underfoot',
      'a bog stretches out, thick with mist',
    ],
    symbol: '🐸',
  },
  [TerrainType.Thicket]: {
    name: 'Thicket',
    descriptions: [
      'Dense brambles and tangled undergrowth form an impenetrable wall of thorns. Berry bushes grow thick here, but so do the nettles.',
      'A snarl of thorny bushes blocks the path. The vegetation is so thick that even light barely filters through.',
    ],
    glimpses: [
      'a wall of thorny thicket bars passage',
      'dense brambles choke the way ahead',
    ],
    symbol: '🌿',
  },
}

export function getBiomeData(terrain: TerrainType): BiomeData {
  return biomeData[terrain]
}

export function getTileDescription(terrain: TerrainType, seed: number): string {
  const data = biomeData[terrain]
  const index = Math.abs(seed) % data.descriptions.length
  return data.descriptions[index]
}

export function getPeripheralGlimpse(
  terrain: TerrainType,
  direction: Direction,
  seed: number,
): string {
  const data = biomeData[terrain]
  const index = Math.abs(seed) % data.glimpses.length
  const dirLabel =
    direction === 'north' ? 'To the North' :
    direction === 'east' ? 'To the East' :
    direction === 'south' ? 'To the South' :
    'To the West'
  return `${dirLabel}, ${data.glimpses[index]}.`
}

export function getBiomeSymbol(terrain: TerrainType): string {
  return biomeData[terrain].symbol
}
