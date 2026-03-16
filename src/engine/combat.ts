import type { Player, ActiveEnemy, Skill, StatusEffect } from './types'
import { AP_COST_ATTACK, AP_COST_FLEE } from './types'
import { getEquippedItem } from './inventory'

export type CombatOutcome = 'ongoing' | 'victory' | 'defeat'

export interface CombatActionResult {
  success: boolean
  reason?: string
  player: Player
  enemy: ActiveEnemy
  messages: string[]
}

export interface FleeResult {
  success: boolean
  fled: boolean
  reason?: string
  player: Player
  message: string
}

export interface EnemyTurnResult {
  player: Player
  enemy: ActiveEnemy
  messages: string[]
}

export function tickStatusEffects(effects: StatusEffect[]): StatusEffect[] {
  return effects
    .map((e) => ({ ...e, remainingTurns: e.remainingTurns - 1 }))
    .filter((e) => e.remainingTurns > 0)
}

function applyPoison(enemy: ActiveEnemy): { enemy: ActiveEnemy; messages: string[] } {
  const poisoned = enemy.statusEffects.some((e) => e.type === 'poison')
  if (!poisoned) return { enemy, messages: [] }
  const newHp = Math.max(0, enemy.hp - 1)
  return {
    enemy: { ...enemy, hp: newHp },
    messages: [`The poison courses through the ${enemy.name}, dealing 1 damage.`],
  }
}

function isDazed(entity: { statusEffects: StatusEffect[] }): boolean {
  return entity.statusEffects.some((e) => e.type === 'daze')
}


export function getCombatOutcome(player: Player, enemy: ActiveEnemy): CombatOutcome {
  if (enemy.hp <= 0) return 'victory'
  if (player.hp <= 0) return 'defeat'
  return 'ongoing'
}

export function playerBasicAttack(player: Player, enemy: ActiveEnemy): CombatActionResult {
  if (player.ap < AP_COST_ATTACK) {
    return { success: false, reason: 'Not enough AP to attack.', player, enemy, messages: [] }
  }

  const updatedPlayer = { ...player, ap: player.ap - AP_COST_ATTACK }
  const equipped = getEquippedItem(player)
  
  let damage: number
  let attackMessage: string
  
  if (equipped) {
    damage = equipped.attackPower
    attackMessage = `You strike the ${enemy.name} with your ${equipped.name} for ${damage} damage.`
  } else {
    damage = 1
    attackMessage = `You punch the ${enemy.name} for ${damage} damage.`
  }
  
  const newHp = Math.max(0, enemy.hp - damage)
  const updatedEnemy = { ...enemy, hp: newHp }
  const messages = [attackMessage]

  if (newHp <= 0) {
    messages.push(`The ${enemy.name} is defeated!`)
  }

  return { success: true, player: updatedPlayer, enemy: updatedEnemy, messages }
}

export function playerSkillAttack(player: Player, enemy: ActiveEnemy, skill: Skill): CombatActionResult {
  if (player.ap < skill.apCost) {
    return { success: false, reason: 'Not enough AP for this skill.', player, enemy, messages: [] }
  }

  const equipped = getEquippedItem(player)
  if (!equipped || equipped.category !== skill.requiredItemCategory) {
    return { success: false, reason: 'Requires a matching weapon equipped.', player, enemy, messages: [] }
  }

  const updatedPlayer = { ...player, ap: player.ap - skill.apCost }
  let updatedEnemy = { ...enemy, statusEffects: [...enemy.statusEffects] }
  const messages: string[] = []

  switch (skill.effect.type) {
    case 'damage': {
      const newHp = Math.max(0, updatedEnemy.hp - skill.effect.power)
      updatedEnemy = { ...updatedEnemy, hp: newHp }
      messages.push(`You use ${skill.name} on the ${enemy.name} for ${skill.effect.power} damage!`)
      break
    }
    case 'damage_status': {
      const newHp = Math.max(0, updatedEnemy.hp - skill.effect.power)
      updatedEnemy = {
        ...updatedEnemy,
        hp: newHp,
        statusEffects: [
          ...updatedEnemy.statusEffects,
          { type: skill.effect.statusEffect, remainingTurns: skill.effect.duration },
        ],
      }
      messages.push(
        `You use ${skill.name} on the ${enemy.name} for ${skill.effect.power} damage and inflict ${skill.effect.statusEffect}!`,
      )
      break
    }
    case 'status': {
      if (skill.effect.statusEffect === 'shield') {
        // Shield is a player-side buff, stored as a transient flag for the next enemy attack
        return {
          success: true,
          player: { ...updatedPlayer },
          enemy: updatedEnemy,
          messages: [`You conjure a ${skill.name}, ready to absorb the next blow.`],
        }
      }
      updatedEnemy = {
        ...updatedEnemy,
        statusEffects: [
          ...updatedEnemy.statusEffects,
          { type: skill.effect.statusEffect, remainingTurns: skill.effect.duration },
        ],
      }
      messages.push(`You cast ${skill.name}, inflicting ${skill.effect.statusEffect} on the ${enemy.name}!`)
      break
    }
    case 'dodge_next': {
      messages.push(`You prepare to ${skill.name.toLowerCase()}, bracing for the next attack.`)
      return {
        success: true,
        player: updatedPlayer,
        enemy: updatedEnemy,
        messages,
      }
    }
  }

  if (updatedEnemy.hp <= 0) {
    messages.push(`The ${enemy.name} is defeated!`)
  }

  return { success: true, player: updatedPlayer, enemy: updatedEnemy, messages }
}

export function enemyTurn(enemy: ActiveEnemy, player: Player, playerDodgeChance: number = 0, playerHasShield: boolean = false): EnemyTurnResult {
  const messages: string[] = []

  // Apply poison damage at the start of the enemy phase
  const poisonResult = applyPoison(enemy)
  let updatedEnemy = poisonResult.enemy
  messages.push(...poisonResult.messages)

  if (updatedEnemy.hp <= 0) {
    messages.push(`The ${enemy.name} succumbs to poison!`)
    return { player, enemy: updatedEnemy, messages }
  }

  if (isDazed(updatedEnemy)) {
    messages.push(`The ${enemy.name} is dazed and cannot act!`)
    updatedEnemy = { ...updatedEnemy, statusEffects: tickStatusEffects(updatedEnemy.statusEffects) }
    return { player, enemy: updatedEnemy, messages }
  }

  // Dodge check
  if (playerDodgeChance > 0 && Math.random() < playerDodgeChance) {
    messages.push(`You dodge the ${enemy.name}'s attack!`)
    updatedEnemy = { ...updatedEnemy, statusEffects: tickStatusEffects(updatedEnemy.statusEffects) }
    return { player, enemy: updatedEnemy, messages }
  }

  // Shield absorb
  if (playerHasShield) {
    messages.push(`Your mystic shield absorbs the ${enemy.name}'s attack!`)
    updatedEnemy = { ...updatedEnemy, statusEffects: tickStatusEffects(updatedEnemy.statusEffects) }
    return { player, enemy: updatedEnemy, messages }
  }

  // Enemy attacks: each hit inflicts 1 damage
  const updatedPlayer = { ...player, hp: Math.max(0, player.hp - 1) }
  messages.push(`The ${enemy.name} strikes you for 1 damage!`)

  if (updatedPlayer.hp <= 0) {
    messages.push('You are overwhelmed by your wounds...')
  }

  updatedEnemy = { ...updatedEnemy, statusEffects: tickStatusEffects(updatedEnemy.statusEffects) }
  return { player: updatedPlayer, enemy: updatedEnemy, messages }
}

export function attemptFlee(player: Player, rng: () => number): FleeResult {
  if (player.ap < AP_COST_FLEE) {
    return { success: false, fled: false, reason: 'Not enough AP to flee.', player, message: 'Not enough AP to flee.' }
  }

  const updatedPlayer = { ...player, ap: player.ap - AP_COST_FLEE }
  const roll = rng()

  // 30% chance to fail fleeing (stay in combat) - when roll >= 0.7
  if (roll >= 0.7) {
    return {
      success: true,
      fled: false,
      player: updatedPlayer,
      message: 'You try to flee but the enemy blocks your path!',
    }
  }

  // 70% chance to successfully flee, but 50% of those result in taking damage
  if (roll < 0.35) {
    // Flee successfully but take damage (50% of successful flee attempts)
    const damagedPlayer = { ...updatedPlayer, hp: Math.max(0, updatedPlayer.hp - 1) }
    const messages = [
      'You manage to escape!',
      'The enemy lands a parting blow as you flee!'
    ]
    
    return {
      success: true,
      fled: true,
      player: damagedPlayer,
      message: messages.join(' '),
    }
  }

  // Flee successfully without damage
  return {
    success: true,
    fled: true,
    player: updatedPlayer,
    message: 'You manage to escape!',
  }
}
