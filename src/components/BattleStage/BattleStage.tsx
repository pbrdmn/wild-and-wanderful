import type { AnimalSpecies as AnimalSpeciesType, ActiveEnemy, LegacyNpc, TerrainType } from '../../engine/types'
import { getBackSpriteStyle, getFrontSpriteStyle } from '../../sprites/spriteConfig'
import { getTerrainBackground } from '../../sprites/terrainBackgrounds'
import { getEnemySpriteData, getEnemySpriteStyle } from '../../sprites/enemySprites'
import { ENEMY_REGISTRY } from '../../engine/enemies'
import styles from './BattleStage.module.css'

function StatusEffectIcon({ type }: { type: string }) {
  const labels: Record<string, string> = {
    daze: '💫',
    poison: '🧪',
    shield: '🛡️',
  }
  return <span className={styles.statusIcon} title={type}>{labels[type] ?? '?'}</span>
}

function enemyIdFromName(name: string): string {
  const entry = ENEMY_REGISTRY.find((e) => e.name === name)
  return entry?.id ?? ''
}

interface BattleStageProps {
  terrain: TerrainType
  playerSpecies: AnimalSpeciesType
  activeEnemy?: ActiveEnemy
  legacyNpc?: LegacyNpc
  inCombat: boolean
}

export function BattleStage({
  terrain,
  playerSpecies,
  activeEnemy,
  legacyNpc,
  inCombat,
}: BattleStageProps) {
  const bg = getTerrainBackground(terrain)
  const enemyId = activeEnemy ? enemyIdFromName(activeEnemy.name) : ''
  const enemySprite = enemyId ? getEnemySpriteData(enemyId) : null

  const showEnemy = inCombat && activeEnemy != null
  const showNpc = !inCombat && legacyNpc != null

  return (
    <div className={styles.stage} data-testid="battle-stage">
      <div className={styles.background} style={{ background: bg.background }} />
      <div className={styles.ground} style={{ backgroundColor: bg.groundColor }} />

      {showEnemy && activeEnemy && (
        <>
          <div className={styles.enemyInfoBar} data-testid="stage-enemy-info">
            <div className={styles.enemyNameRow}>
              <span className={styles.enemyNameLabel}>{activeEnemy.name}</span>
              {activeEnemy.statusEffects.length > 0 && (
                <span className={styles.statusEffects} data-testid="stage-enemy-status">
                  {activeEnemy.statusEffects.map((e, i) => (
                    <StatusEffectIcon key={`${e.type}-${i}`} type={e.type} />
                  ))}
                </span>
              )}
            </div>
            <div className={styles.hpBarTrack} data-testid="stage-enemy-hp">
              <div
                className={styles.hpBarFill}
                style={{ width: `${Math.max(0, (activeEnemy.hp / activeEnemy.maxHp) * 100)}%` }}
              />
              <span className={styles.hpBarLabel}>{activeEnemy.hp}/{activeEnemy.maxHp}</span>
            </div>
          </div>
          <div className={styles.enemyPlatform}>
            <div
              className={styles.enemySprite}
              style={getEnemySpriteStyle(enemyId)}
              data-testid="enemy-sprite"
            >
              {enemySprite?.symbol}
            </div>
            <div className={styles.enemyShadow} />
          </div>
        </>
      )}

      {showNpc && legacyNpc && (
        <div className={styles.enemyPlatform}>
          <div
            className={styles.npcSprite}
            style={getFrontSpriteStyle(legacyNpc.species)}
            data-testid="npc-sprite"
          />
          <div className={styles.enemyShadow} />
        </div>
      )}

      <div className={styles.playerPlatform}>
        <div
          className={styles.playerSprite}
          style={getBackSpriteStyle(playerSpecies)}
          data-testid="player-sprite"
        />
        <div className={styles.playerShadow} />
      </div>
    </div>
  )
}
