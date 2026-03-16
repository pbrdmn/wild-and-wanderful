import { useGameStore } from '../../stores/gameStore'
import { SKILL_REGISTRY } from '../../engine/skills'
import { ItemCategory } from '../../engine/types'
import type { Skill } from '../../engine/types'
import styles from './SkillsView.module.css'

const CATEGORY_LABELS: Record<string, string> = {
  [ItemCategory.Melee]: 'Melee',
  [ItemCategory.Ranged]: 'Ranged',
  [ItemCategory.Magic]: 'Magic',
}

const SKILL_CATEGORY_LABELS: Record<string, string> = {
  offensive: 'Offensive',
  defensive: 'Defensive',
  utility: 'Utility',
}

function SkillCard({ skill, isUnlocked, isActive, isUsable, onToggle, onUse }: {
  skill: Skill
  isUnlocked: boolean
  isActive: boolean
  isUsable: boolean
  onToggle: () => void
  onUse: () => void
}) {
  const isImmediateUse = skill.immediateUse
  
  return (
    <button
      className={`${styles.skillCard} ${isActive ? styles.active : ''} ${!isUnlocked ? styles.locked : ''} ${isUsable ? styles.usable : ''}`}
      onClick={isImmediateUse ? onUse : onToggle}
      disabled={!isUnlocked}
      data-testid={`skill-card-${skill.id}`}
    >
      <div className={styles.skillHeader}>
        <span className={styles.skillName}>{skill.name}</span>
        <span className={styles.skillCost}>{skill.apCost} AP</span>
      </div>
      <p className={styles.skillDesc}>{skill.description}</p>
      <div className={styles.skillMeta}>
        <span className={styles.skillCategory}>
          {SKILL_CATEGORY_LABELS[skill.skillCategory]}
        </span>
        <span className={styles.skillRequires}>
          {skill.requiredItemCategory ? `Requires: ${CATEGORY_LABELS[skill.requiredItemCategory]}` : 'No requirements'}
        </span>
      </div>
      {isImmediateUse && <span className={styles.immediateBadge}>Immediate</span>}
      {isActive && <span className={styles.activeBadge}>Active</span>}
      {!isUnlocked && <span className={styles.lockedLabel}>Locked</span>}
    </button>
  )
}

export function SkillsView() {
  const player = useGameStore((s) => s.player)
  const setView = useGameStore((s) => s.setView)
  const setActiveSkills = useGameStore((s) => s.setActiveSkills)
  const activateSkill = useGameStore((s) => s.activateSkill)
  const message = useGameStore((s) => s.message)
  const equippedItem = useGameStore((s) => s.equippedItem)

  const equipped = equippedItem()
  const { unlockedSkillIds, activeSkillIds, maxActiveSkills } = player

  function handleToggle(skillId: string) {
    if (activeSkillIds.includes(skillId)) {
      setActiveSkills(activeSkillIds.filter((id) => id !== skillId))
    } else {
      if (activeSkillIds.length >= maxActiveSkills) return
      setActiveSkills([...activeSkillIds, skillId])
    }
  }

  const groupedByCategory: Record<string, Skill[]> = {}
  for (const skill of SKILL_REGISTRY) {
    const cat = skill.requiredItemCategory || 'none'
    if (!groupedByCategory[cat]) groupedByCategory[cat] = []
    groupedByCategory[cat].push(skill)
  }

  return (
    <div className={styles.skillsView}>
      <header className={styles.header}>
        <h1 className={styles.title}>Skills</h1>
        <span className={styles.slotInfo} data-testid="active-slot-count">
          {activeSkillIds.length}/{maxActiveSkills} active
        </span>
      </header>

      <main className={styles.content}>
        {Object.entries(groupedByCategory).map(([category, skills]) => (
          <div key={category} className={styles.categoryGroup}>
            <h2 className={styles.categoryTitle} data-testid={`category-${category}`}>
              {category === 'none' ? 'General Skills' : CATEGORY_LABELS[category]} Skills
            </h2>
            <div className={styles.skillGrid}>
              {skills.map((skill) => {
                const isUnlocked = unlockedSkillIds.includes(skill.id)
                const isActive = activeSkillIds.includes(skill.id)
                const isUsable = equipped?.category === skill.requiredItemCategory
                const handleUseSkill = () => activateSkill(skill.id)
                return (
                  <SkillCard
                    key={skill.id}
                    skill={skill}
                    isUnlocked={isUnlocked}
                    isActive={isActive}
                    isUsable={isUsable}
                    onToggle={() => handleToggle(skill.id)}
                    onUse={handleUseSkill}
                  />
                )
              })}
            </div>
          </div>
        ))}

        {message && (
          <p className={styles.message} data-testid="skills-message" role="status">
            {message}
          </p>
        )}
      </main>

      <footer className={styles.footer}>
        <button
          className={styles.closeBtn}
          onClick={() => setView('scene')}
          data-testid="close-skills-button"
        >
          Close
        </button>
      </footer>
    </div>
  )
}
