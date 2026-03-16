import type { Player, Skill, ItemCategory } from './types'
import { ItemCategory as IC, DEFAULT_MAX_ACTIVE_SKILLS } from './types'
import { getEquippedItem } from './inventory'

export const SKILL_REGISTRY: readonly Skill[] = [
  {
    id: 'search',
    name: 'Search',
    description: 'Search the area for hidden paths.',
    skillCategory: 'utility',
    requiredItemCategory: null,
    apCost: 0,
    effect: { type: 'search' },
    immediateUse: true,
  },
  {
    id: 'heavy-strike',
    name: 'Heavy Strike',
    description: 'A powerful melee blow that deals extra damage.',
    skillCategory: 'offensive',
    requiredItemCategory: IC.Melee,
    apCost: 2,
    effect: { type: 'damage', power: 5 },
  },
  {
    id: 'daze-slam',
    name: 'Daze Slam',
    description: 'Slam the enemy, dealing damage and leaving them dazed.',
    skillCategory: 'offensive',
    requiredItemCategory: IC.Melee,
    apCost: 2,
    effect: { type: 'damage_status', power: 3, statusEffect: 'daze', duration: 1 },
  },
  {
    id: 'parry',
    name: 'Parry',
    description: 'Brace for the next attack with a chance to dodge it entirely.',
    skillCategory: 'defensive',
    requiredItemCategory: IC.Melee,
    apCost: 1,
    effect: { type: 'dodge_next', chance: 0.6 },
  },
  {
    id: 'precision-shot',
    name: 'Precision Shot',
    description: 'A carefully aimed shot that deals high damage.',
    skillCategory: 'offensive',
    requiredItemCategory: IC.Ranged,
    apCost: 2,
    effect: { type: 'damage', power: 4 },
  },
  {
    id: 'pin-down',
    name: 'Pin Down',
    description: 'Pin the enemy in place, dealing damage and dazing them.',
    skillCategory: 'offensive',
    requiredItemCategory: IC.Ranged,
    apCost: 2,
    effect: { type: 'damage_status', power: 2, statusEffect: 'daze', duration: 1 },
  },
  {
    id: 'quick-dodge',
    name: 'Quick Dodge',
    description: 'Nimbly dodge the next incoming attack.',
    skillCategory: 'defensive',
    requiredItemCategory: IC.Ranged,
    apCost: 1,
    effect: { type: 'dodge_next', chance: 0.7 },
  },
  {
    id: 'arcane-bolt',
    name: 'Arcane Bolt',
    description: 'Hurl a bolt of arcane energy at the enemy.',
    skillCategory: 'offensive',
    requiredItemCategory: IC.Magic,
    apCost: 2,
    effect: { type: 'damage', power: 4 },
  },
  {
    id: 'hex',
    name: 'Hex',
    description: 'Curse the enemy with a lingering poison.',
    skillCategory: 'utility',
    requiredItemCategory: IC.Magic,
    apCost: 1,
    effect: { type: 'status', statusEffect: 'poison', duration: 3 },
  },
  {
    id: 'mystic-shield',
    name: 'Mystic Shield',
    description: 'Conjure a shield that absorbs the next wound.',
    skillCategory: 'defensive',
    requiredItemCategory: IC.Magic,
    apCost: 1,
    effect: { type: 'status', statusEffect: 'shield', duration: 1 },
  },
] as const

export function getSkillById(skillId: string): Skill | undefined {
  return SKILL_REGISTRY.find((s) => s.id === skillId)
}

export function getAvailableSkills(player: Player): Skill[] {
  const equipped = getEquippedItem(player)
  return player.unlockedSkillIds
    .map((id) => getSkillById(id))
    .filter((s): s is Skill => s !== undefined && 
      (s.requiredItemCategory === null || (equipped !== null && s.requiredItemCategory === equipped.category)))
}

export function canUseSkill(player: Player, skillId: string): boolean {
  const skill = getSkillById(skillId)
  if (!skill) return false
  if (!player.unlockedSkillIds.includes(skillId)) return false
  if (!player.activeSkillIds.includes(skillId)) return false
  if (player.ap < skill.apCost) return false
  const equipped = getEquippedItem(player)
  if (skill.requiredItemCategory !== null && (!equipped || equipped.category !== skill.requiredItemCategory)) return false
  return true
}

export interface SkillActionResult {
  success: boolean
  reason?: string
  player: Player
}

export function unlockSkill(player: Player, skillId: string): SkillActionResult {
  if (!getSkillById(skillId)) {
    return { success: false, reason: 'Unknown skill.', player }
  }
  if (player.unlockedSkillIds.includes(skillId)) {
    return { success: false, reason: 'Skill already unlocked.', player }
  }
  return {
    success: true,
    player: { ...player, unlockedSkillIds: [...player.unlockedSkillIds, skillId] },
  }
}

export function setActiveSkills(player: Player, skillIds: string[]): SkillActionResult {
  if (skillIds.length > player.maxActiveSkills) {
    return { success: false, reason: `Cannot have more than ${player.maxActiveSkills} active skills.`, player }
  }
  const allUnlocked = skillIds.every((id) => player.unlockedSkillIds.includes(id))
  if (!allUnlocked) {
    return { success: false, reason: 'Cannot activate a skill that is not unlocked.', player }
  }
  const allValid = skillIds.every((id) => getSkillById(id) !== undefined)
  if (!allValid) {
    return { success: false, reason: 'Unknown skill in list.', player }
  }
  return {
    success: true,
    player: { ...player, activeSkillIds: [...skillIds] },
  }
}

export function createDefaultSkillState(): Pick<Player, 'unlockedSkillIds' | 'activeSkillIds' | 'maxActiveSkills'> {
  return {
    unlockedSkillIds: [],
    activeSkillIds: [],
    maxActiveSkills: DEFAULT_MAX_ACTIVE_SKILLS,
  }
}
