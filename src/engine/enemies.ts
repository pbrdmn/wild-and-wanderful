import type { ActiveEnemy, TerrainType, Tile } from './types'
import { TerrainType as TT } from './types'

export interface EnemyTemplate {
  id: string
  name: string
  strength: number
  hp: number
  biomes: readonly TerrainType[]
}

export const ENEMY_REGISTRY: readonly EnemyTemplate[] = [
  { id: 'shadow-wolf', name: 'Shadow Wolf', strength: 1, hp: 2, biomes: [TT.Forest] },
  { id: 'thorn-sprite', name: 'Thorn Sprite', strength: 1, hp: 1, biomes: [TT.Forest, TT.Thicket] },
  { id: 'bandit-rat', name: 'Bandit Rat', strength: 1, hp: 2, biomes: [TT.Meadow] },
  { id: 'wild-boar', name: 'Wild Boar', strength: 2, hp: 3, biomes: [TT.Meadow] },
  { id: 'marsh-serpent', name: 'Marsh Serpent', strength: 2, hp: 2, biomes: [TT.Swamp, TT.Thicket] },
  { id: 'stone-golem', name: 'Stone Golem', strength: 3, hp: 4, biomes: [TT.Mountain] },
  { id: 'highwayman-fox', name: 'Highwayman Fox', strength: 2, hp: 3, biomes: [TT.Road] },
  { id: 'wandering-shade', name: 'Wandering Shade', strength: 2, hp: 2, biomes: [TT.Forest, TT.Meadow, TT.Road, TT.River, TT.Swamp, TT.Thicket, TT.Mountain] },
] as const

export function getEnemiesForBiome(terrain: TerrainType): EnemyTemplate[] {
  return ENEMY_REGISTRY.filter((e) => e.biomes.includes(terrain))
}

export function createActiveEnemy(template: EnemyTemplate, level: number, hasInitiative: boolean): ActiveEnemy {
  const hp = level + 3
  const strength = Math.max(1, Math.floor(level * 0.8))
  return {
    name: template.name,
    strength,
    level,
    hp,
    maxHp: hp,
    hasInitiative,
    statusEffects: [],
  }
}

const ENEMY_PLACEMENT_CHANCE = 0.18

export function placeEnemies(
  tiles: Tile[][],
  width: number,
  height: number,
  rng: () => number,
): void {
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const tile = tiles[y][x]
      if (tile.terrain === 'village' || tile.terrain === 'lake') continue
      if (tile.enemyId) continue
      if (rng() >= ENEMY_PLACEMENT_CHANCE) continue

      const candidates = getEnemiesForBiome(tile.terrain)
      if (candidates.length === 0) continue

      const picked = candidates[Math.floor(rng() * candidates.length)]
      tile.enemyId = picked.id
    }
  }
}

export function getEnemyById(enemyId: string): EnemyTemplate | undefined {
  return ENEMY_REGISTRY.find((e) => e.id === enemyId)
}

export function checkTileEncounter(tile: Tile, playerLevel: number, rng: () => number): ActiveEnemy | null {
  if (!tile.enemyId) return null
  const template = getEnemyById(tile.enemyId)
  if (!template) return null
  const enemyLevel = Math.floor(rng() * (playerLevel + 1)) + 1
  return createActiveEnemy(template, enemyLevel, rng() < 0.3)
}
