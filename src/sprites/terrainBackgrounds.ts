import type { TerrainType } from '../engine/types'

export interface TerrainBackground {
  background: string
  groundColor: string
}

const terrainBackgrounds: Record<TerrainType, TerrainBackground> = {
  forest: {
    background: 'linear-gradient(180deg, #6b9b7a 0%, #4a7a5a 30%, #3d6b4a 60%, #2d4a35 100%)',
    groundColor: '#3a5a3a',
  },
  meadow: {
    background: 'linear-gradient(180deg, #a8cce0 0%, #d4e8b8 35%, #b8d48a 60%, #98b86a 100%)',
    groundColor: '#8aaa5a',
  },
  river: {
    background: 'linear-gradient(180deg, #a8cce0 0%, #7ba7c2 30%, #5a8aaa 60%, #4a7a9a 100%)',
    groundColor: '#5a8a7a',
  },
  lake: {
    background: 'linear-gradient(180deg, #b8d0e8 0%, #8ab0d0 30%, #6a98c0 60%, #5a88b0 100%)',
    groundColor: '#5a8a7a',
  },
  road: {
    background: 'linear-gradient(180deg, #c8d8c0 0%, #d4c8a8 30%, #c8b896 60%, #b8a880 100%)',
    groundColor: '#a89878',
  },
  village: {
    background: 'linear-gradient(180deg, #c8d8c0 0%, #d8c8a0 30%, #d4a76a 60%, #c89858 100%)',
    groundColor: '#b8946a',
  },
  mountain: {
    background: 'linear-gradient(180deg, #b8c8d8 0%, #9aaab8 30%, #8a9aa8 60%, #7a8a98 100%)',
    groundColor: '#7a8888',
  },
  swamp: {
    background: 'linear-gradient(180deg, #8a9a7a 0%, #6b7a5a 30%, #5a6a48 60%, #4a5a38 100%)',
    groundColor: '#4a5a3a',
  },
  thicket: {
    background: 'linear-gradient(180deg, #5a8a5a 0%, #4a7a48 30%, #3a6a38 60%, #2a5a28 100%)',
    groundColor: '#3a5a30',
  },
}

export function getTerrainBackground(terrain: TerrainType): TerrainBackground {
  return terrainBackgrounds[terrain]
}
