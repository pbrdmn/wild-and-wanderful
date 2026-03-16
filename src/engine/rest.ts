import type { Player, ActiveEnemy } from './types'
import { AMBUSH_CHANCE } from './types'
import { ENEMY_REGISTRY, createActiveEnemy } from './enemies'

const AMBUSH_ENEMY_IDS = ['shadow-wolf', 'bandit-rat', 'thorn-sprite'] as const

export interface RestResult {
  success: boolean
  reason?: string
  player: Player
  woundHealed: boolean
  ambushed: boolean
  enemy?: ActiveEnemy
}

export function rest(player: Player, rng: () => number): RestResult {
  let updatedPlayer: Player = { ...player }

  let hpHealed = false
  if (updatedPlayer.hp < updatedPlayer.maxHp) {
    updatedPlayer = { ...updatedPlayer, hp: updatedPlayer.hp + 1 }
    hpHealed = true
  }

  const ambushRoll = rng()
  if (ambushRoll < AMBUSH_CHANCE) {
    const ambushTemplates = ENEMY_REGISTRY.filter((e) => AMBUSH_ENEMY_IDS.includes(e.id as typeof AMBUSH_ENEMY_IDS[number]))
    const template = ambushTemplates[Math.floor(rng() * ambushTemplates.length)]
    const enemy: ActiveEnemy = createActiveEnemy(template, 1, true)
    return {
      success: true,
      player: updatedPlayer,
      woundHealed: hpHealed,
      ambushed: true,
      enemy,
    }
  }

  return {
    success: true,
    player: updatedPlayer,
    woundHealed: hpHealed,
    ambushed: false,
  }
}
