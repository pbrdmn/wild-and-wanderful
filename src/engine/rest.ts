import type { Player, ActiveEnemy } from './types'
import { AP_COST_REST, AMBUSH_CHANCE } from './types'

const AMBUSH_ENEMIES: readonly { name: string; strength: number }[] = [
  { name: 'Shadow Wolf', strength: 1 },
  { name: 'Bandit Rat', strength: 1 },
  { name: 'Thorn Sprite', strength: 1 },
]

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
    const enemyTemplate = AMBUSH_ENEMIES[Math.floor(rng() * AMBUSH_ENEMIES.length)]
    const enemy: ActiveEnemy = { ...enemyTemplate, hasInitiative: true }
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
