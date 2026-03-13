import { describe, it, expect } from 'vitest'
import { TerrainType } from '../../src/engine/types'
import { Direction } from '../../src/engine/types'
import {
  getBiomeData,
  getTileDescription,
  getPeripheralGlimpse,
  getBiomeSymbol,
} from '../../src/engine/biomes'

const allTerrainTypes: TerrainType[] = [
  TerrainType.Forest,
  TerrainType.Meadow,
  TerrainType.River,
  TerrainType.Lake,
  TerrainType.Road,
  TerrainType.Village,
  TerrainType.Mountain,
  TerrainType.Swamp,
  TerrainType.Thicket,
]

describe('biomes', () => {
  describe('getBiomeData', () => {
    it.each(allTerrainTypes)('returns data for %s', (terrain) => {
      const data = getBiomeData(terrain)
      expect(data.name).toBeTruthy()
      expect(data.descriptions.length).toBeGreaterThanOrEqual(1)
      expect(data.glimpses.length).toBeGreaterThanOrEqual(1)
      expect(data.symbol).toBeTruthy()
    })
  })

  describe('getTileDescription', () => {
    it('returns a non-empty string for every terrain type', () => {
      for (const terrain of allTerrainTypes) {
        const desc = getTileDescription(terrain, 0)
        expect(desc.length).toBeGreaterThan(0)
      }
    })

    it('cycles through descriptions with different seeds', () => {
      const data = getBiomeData(TerrainType.Forest)
      if (data.descriptions.length > 1) {
        const desc0 = getTileDescription(TerrainType.Forest, 0)
        const desc1 = getTileDescription(TerrainType.Forest, 1)
        expect(desc0).not.toBe(desc1)
      }
    })
  })

  describe('getPeripheralGlimpse', () => {
    it('includes the direction label', () => {
      const glimpse = getPeripheralGlimpse(TerrainType.Forest, Direction.North, 0)
      expect(glimpse).toMatch(/^To the North,/)
    })

    it('works for all four directions', () => {
      const directions = [Direction.North, Direction.East, Direction.South, Direction.West]
      const labels = ['To the North', 'To the East', 'To the South', 'To the West']
      directions.forEach((dir, i) => {
        const glimpse = getPeripheralGlimpse(TerrainType.Meadow, dir, 0)
        expect(glimpse).toContain(labels[i])
      })
    })

    it('ends with a period', () => {
      const glimpse = getPeripheralGlimpse(TerrainType.Village, Direction.East, 0)
      expect(glimpse).toMatch(/\.$/)
    })
  })

  describe('getBiomeSymbol', () => {
    it('returns a symbol for every terrain type', () => {
      for (const terrain of allTerrainTypes) {
        const symbol = getBiomeSymbol(terrain)
        expect(symbol.length).toBeGreaterThan(0)
      }
    })
  })
})
