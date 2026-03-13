import type { Player, ActiveEnemy } from './types'
import { XP_LEVEL_THRESHOLDS } from './types'

export function calculateXpReward(enemy: ActiveEnemy): number {
  return enemy.maxHp
}

export function getLevel(xp: number): number {
  for (let i = XP_LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= XP_LEVEL_THRESHOLDS[i]) return i + 1
  }
  return 1
}

const LEVEL_REWARDS: { maxWounds: number; maxActiveSkills: number }[] = [
  { maxWounds: 1, maxActiveSkills: 2 },
  { maxWounds: 2, maxActiveSkills: 2 },
  { maxWounds: 3, maxActiveSkills: 3 },
  { maxWounds: 4, maxActiveSkills: 3 },
  { maxWounds: 5, maxActiveSkills: 4 },
]

export function getLevelRewards(level: number): { maxWounds: number; maxActiveSkills: number } {
  const idx = Math.min(level, LEVEL_REWARDS.length) - 1
  return LEVEL_REWARDS[Math.max(0, idx)]
}

export function applyLevelUp(player: Player, newLevel: number): Player {
  const rewards = getLevelRewards(newLevel)
  return {
    ...player,
    level: newLevel,
    maxWounds: rewards.maxWounds,
    maxActiveSkills: rewards.maxActiveSkills,
  }
}

export interface LevelUpResult {
  player: Player
  leveled: boolean
  newLevel: number
}

export function checkLevelUp(player: Player): LevelUpResult {
  const newLevel = getLevel(player.xp)
  if (newLevel <= player.level) {
    return { player, leveled: false, newLevel: player.level }
  }
  return {
    player: applyLevelUp(player, newLevel),
    leveled: true,
    newLevel,
  }
}
