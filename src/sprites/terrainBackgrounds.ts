import type { TerrainType } from '../engine/types'

export interface TerrainBackground {
  imageUrl: string
  groundColor: string
}

const terrainBackgrounds: Record<TerrainType, TerrainBackground> = {
  forest: {
    imageUrl: '/scenes/Forest.jpg',
    groundColor: '#3a5a3a',
  },
  meadow: {
    imageUrl: '/scenes/Meadow.jpg',
    groundColor: '#8aaa5a',
  },
  river: {
    imageUrl: '/scenes/River.jpg',
    groundColor: '#5a8a7a',
  },
  lake: {
    imageUrl: '/scenes/Lake.jpg',
    groundColor: '#5a8a7a',
  },
  road: {
    imageUrl: '/scenes/Road.jpg',
    groundColor: '#a89878',
  },
  village: {
    imageUrl: '/scenes/Village.jpg',
    groundColor: '#b8946a',
  },
  mountain: {
    imageUrl: '/scenes/Mountain.jpg',
    groundColor: '#7a8888',
  },
  swamp: {
    imageUrl: '/scenes/Swamp.jpg',
    groundColor: '#4a5a3a',
  },
  thicket: {
    imageUrl: '/scenes/Thicket.jpg',
    groundColor: '#3a5a30',
  },
}

export function getTerrainBackground(terrain: TerrainType): TerrainBackground {
  return terrainBackgrounds[terrain]
}
