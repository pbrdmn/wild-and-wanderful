import { useGameStore } from '../../stores/gameStore'
import { getBiomeData } from '../../engine/biomes'
import { AP_COST_REST, AP_COST_SEARCH, AP_COST_ATTACK, AP_COST_FLEE } from '../../engine/types'
import styles from './SceneView.module.css'

function StatusEffectIcon({ type }: { type: string }) {
  const labels: Record<string, string> = {
    daze: '💫',
    poison: '🧪',
    shield: '🛡️',
  }
  return <span className={styles.statusIcon} title={type}>{labels[type] ?? '?'}</span>
}

export function SceneView() {
  const player = useGameStore((s) => s.player)
  const world = useGameStore((s) => s.world)
  const turnNumber = useGameStore((s) => s.turnNumber)
  const gamePhase = useGameStore((s) => s.gamePhase)
  const activeEnemy = useGameStore((s) => s.activeEnemy)
  const message = useGameStore((s) => s.message)
  const combatLog = useGameStore((s) => s.combatLog)
  const setView = useGameStore((s) => s.setView)
  const endTurn = useGameStore((s) => s.endTurn)
  const rest = useGameStore((s) => s.rest)
  const search = useGameStore((s) => s.search)
  const attack = useGameStore((s) => s.attack)
  const useSkill = useGameStore((s) => s.useSkill)
  const flee = useGameStore((s) => s.flee)
  const currentTileDescription = useGameStore((s) => s.currentTileDescription)
  const peripheralGlimpses = useGameStore((s) => s.peripheralGlimpses)
  const equippedItem = useGameStore((s) => s.equippedItem)
  const availableSkills = useGameStore((s) => s.availableSkills)

  const currentTile = world.tiles[player.y][player.x]
  const biome = getBiomeData(currentTile.terrain)
  const description = currentTileDescription()
  const glimpses = peripheralGlimpses()
  const equipped = equippedItem()
  const skills = availableSkills()

  const inCombat = gamePhase === 'combat' && activeEnemy != null
  const canAct = player.ap >= AP_COST_REST
  const canRest = canAct && player.wounds > 0
  const canSearch = player.ap >= AP_COST_SEARCH
  const canAttack = inCombat && player.ap >= AP_COST_ATTACK && equipped != null
  const canFlee = inCombat && player.ap >= AP_COST_FLEE

  return (
    <div className={styles.sceneView}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <h1 className={styles.title}>{biome.name}</h1>
          <div className={styles.hud}>
            <span className={styles.ap} data-testid="ap-display">
              AP: {player.ap}/{player.maxAp}
            </span>
            <span className={styles.wounds} data-testid="wounds-display">
              Wounds: {player.wounds}/{player.maxWounds}
            </span>
            <span className={styles.turn} data-testid="turn-display">
              Turn {turnNumber}
            </span>
          </div>
        </div>
        {equipped && (
          <div className={styles.equippedBar} data-testid="equipped-display">
            <span className={styles.equippedLabel}>Wielding:</span> {equipped.name}
          </div>
        )}
      </header>

      <main className={styles.content}>
        <p className={styles.description} data-testid="tile-description">
          {description}
        </p>

        {!inCombat && (
          <div className={styles.glimpses} data-testid="peripheral-glimpses">
            {glimpses.map((g) => (
              <p key={g.direction} className={styles.glimpse}>
                {g.text}
              </p>
            ))}
          </div>
        )}

        {inCombat && (
          <div className={styles.combatPanel} data-testid="combat-panel">
            <div className={styles.enemyInfo} data-testid="enemy-info">
              <span className={styles.enemyName}>{activeEnemy.name}</span>
              {activeEnemy.statusEffects.length > 0 && (
                <span className={styles.statusEffects} data-testid="enemy-status-effects">
                  {activeEnemy.statusEffects.map((e, i) => (
                    <StatusEffectIcon key={`${e.type}-${i}`} type={e.type} />
                  ))}
                </span>
              )}
            </div>
            <div className={styles.hpBarTrack} data-testid="enemy-hp-bar">
              <div
                className={styles.hpBarFill}
                style={{ width: `${Math.max(0, (activeEnemy.hp / activeEnemy.maxHp) * 100)}%` }}
              />
              <span className={styles.hpBarLabel}>{activeEnemy.hp}/{activeEnemy.maxHp}</span>
            </div>

            {combatLog.length > 0 && (
              <div className={styles.combatLog} data-testid="combat-log">
                {combatLog.map((msg, i) => (
                  <p key={i} className={styles.combatLogEntry}>{msg}</p>
                ))}
              </div>
            )}

            <div className={styles.combatActions} data-testid="combat-actions">
              <button
                className={`${styles.combatButton} ${!canAttack ? styles.disabled : ''}`}
                onClick={attack}
                disabled={!canAttack}
                data-testid="attack-button"
              >
                Attack
              </button>
              {skills.map((skill) => {
                const canUse = player.ap >= skill.apCost
                return (
                  <button
                    key={skill.id}
                    className={`${styles.combatButton} ${styles.skillButton} ${!canUse ? styles.disabled : ''}`}
                    onClick={() => useSkill(skill.id)}
                    disabled={!canUse}
                    data-testid={`skill-button-${skill.id}`}
                    title={skill.description}
                  >
                    {skill.name} ({skill.apCost} AP)
                  </button>
                )
              })}
              <button
                className={`${styles.combatButton} ${styles.fleeButton} ${!canFlee ? styles.disabled : ''}`}
                onClick={flee}
                disabled={!canFlee}
                data-testid="flee-button"
              >
                Flee
              </button>
            </div>
          </div>
        )}

        {message && (
          <p className={styles.message} data-testid="game-message" role="status">
            {message}
          </p>
        )}
      </main>

      <footer className={styles.actions}>
        {!inCombat && (
          <>
            <button
              className={styles.actionButton}
              onClick={() => setView('map')}
              data-testid="open-map-button"
            >
              Map
            </button>
            <button
              className={styles.actionButton}
              onClick={() => setView('inventory')}
              data-testid="open-inventory-button"
            >
              Pack
            </button>
            <button
              className={styles.actionButton}
              onClick={() => setView('skills')}
              data-testid="open-skills-button"
            >
              Skills
            </button>
            <button
              className={`${styles.actionButton} ${!canSearch ? styles.disabled : ''}`}
              onClick={search}
              disabled={!canSearch}
              data-testid="search-button"
            >
              Search
            </button>
            <button
              className={`${styles.actionButton} ${!canRest ? styles.disabled : ''}`}
              onClick={rest}
              disabled={!canRest}
              data-testid="rest-button"
            >
              Rest
            </button>
          </>
        )}
        <button
          className={styles.actionButton}
          onClick={endTurn}
          data-testid="end-turn-button"
        >
          End Turn
        </button>
      </footer>
    </div>
  )
}
