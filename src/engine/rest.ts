import type { Player, ActiveEnemy } from './types'
import { AP_COST_REST, AMBUSH_CHANCE } from './types'
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
  if (player.ap < AP_COST_REST) {
    return {
      success: false,
      reason: 'Not enough AP to rest.',
      player,
      woundHealed: false,
      ambushed: false,
    }
  }

  let updatedPlayer: Player = { ...player, ap: player.ap - AP_COST_REST }

  let woundHealed = false
  if (updatedPlayer.wounds > 0) {
    updatedPlayer = { ...updatedPlayer, wounds: updatedPlayer.wounds - 1 }
    woundHealed = true
  }

  const ambushRoll = rng()
  if (ambushRoll < AMBUSH_CHANCE) {
    const ambushTemplates = ENEMY_REGISTRY.filter((e) => AMBUSH_ENEMY_IDS.includes(e.id as any))
    const template = ambushTemplates[Math.floor(rng() * ambushTemplates.length)]
    const enemy: ActiveEnemy = createActiveEnemy(template, true)
    return {
      success: true,
      player: updatedPlayer,
      woundHealed,
      ambushed: true,
      enemy,
    }
  }

  return {
    success: true,
    player: updatedPlayer,
    woundHealed,
    ambushed: false,
  }
}
