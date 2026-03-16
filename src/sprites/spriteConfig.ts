import type { AnimalSpecies as AnimalSpeciesType } from '../engine/types'

interface SpriteCell {
  col: number
  row: number
  cols: number
}

const SPRITE_LAYOUT: Record<AnimalSpeciesType, SpriteCell> = {
  fox:     { col: 0, row: 0, cols: 3 },
  bear:    { col: 1, row: 0, cols: 3 },
  mouse:   { col: 2, row: 0, cols: 3 },
  raccoon: { col: 0, row: 1, cols: 4 },
  cat:     { col: 1, row: 1, cols: 4 },
  bird:    { col: 2, row: 1, cols: 4 },
  frog:    { col: 3, row: 1, cols: 4 },
}

function buildSpriteStyle(species: AnimalSpeciesType, sheet: string): React.CSSProperties {
  const cfg = SPRITE_LAYOUT[species] ?? SPRITE_LAYOUT.fox
  const bgSize = `${cfg.cols * 100}% 200%`
  const posX = cfg.cols > 1 ? (cfg.col / (cfg.cols - 1)) * 100 : 0
  const posY = cfg.row * 100
  
  // Add base path for GitHub Pages deployment
  const basePath = import.meta.env.PROD ? '/wild-and-wanderful' : ''
  const spritePath = `${basePath}${sheet}`
  
  return {
    backgroundImage: `url(${spritePath})`,
    backgroundSize: bgSize,
    backgroundPosition: `${posX}% ${posY}%`,
    backgroundRepeat: 'no-repeat',
  }
}

export function getFrontSpriteStyle(species: AnimalSpeciesType): React.CSSProperties {
  return buildSpriteStyle(species, '/character-selection.png')
}

export function getBackSpriteStyle(species: AnimalSpeciesType): React.CSSProperties {
  return buildSpriteStyle(species, '/characters.png')
}

export const SPECIES_LABELS: Record<AnimalSpeciesType, string> = {
  fox: 'Fox',
  bear: 'Bear',
  mouse: 'Mouse',
  raccoon: 'Raccoon',
  cat: 'Cat',
  bird: 'Bird',
  frog: 'Frog',
}
