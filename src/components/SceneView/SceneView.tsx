import { useState } from 'react'
import { useGameStore } from '../../stores/gameStore'
import { getBiomeData } from '../../engine/biomes'
import { canMoveTo } from '../../engine/movement'
import { AP_COST_ATTACK, AP_COST_FLEE, DIRECTION_OFFSETS, Direction } from '../../engine/types'
import { SPECIES_LABELS } from '../../sprites/spriteConfig'
import { playSound, isMuted, setMuted } from '../../utils/audio'
import { BattleStage } from '../BattleStage/BattleStage'
import { DirectionalGrid } from '../DirectionalGrid'
import styles from './SceneView.module.css'

export function SceneView() {
  const player = useGameStore((s) => s.player)
  const world = useGameStore((s) => s.world)
  const gamePhase = useGameStore((s) => s.gamePhase)
  const activeEnemy = useGameStore((s) => s.activeEnemy)
  const message = useGameStore((s) => s.message)
  const combatLog = useGameStore((s) => s.combatLog)
  const setView = useGameStore((s) => s.setView)
  const endTurn = useGameStore((s) => s.endTurn)
  const storeRest = useGameStore((s) => s.rest)
  const storeSearch = useGameStore((s) => s.search)
  const storeAttack = useGameStore((s) => s.attack)
  const useSkill = useGameStore((s) => s.useSkill)
  const flee = useGameStore((s) => s.flee)
  const retire = useGameStore((s) => s.retire)
  const currentTileDescription = useGameStore((s) => s.currentTileDescription)
  const peripheralGlimpses = useGameStore((s) => s.peripheralGlimpses)
  const storeMove = useGameStore((s) => s.movePlayer)
  const equippedItem = useGameStore((s) => s.equippedItem)
  const availableSkills = useGameStore((s) => s.availableSkills)

  const [soundMuted, setSoundMuted] = useState(isMuted())

  const toggleMute = () => {
    const next = !soundMuted
    setSoundMuted(next)
    setMuted(next)
  }

  const movePlayer = (x: number, y: number) => {
    storeMove(x, y)
    playSound('move')
  }

  const search = () => {
    storeSearch()
    playSound('tap')
  }

  const rest = () => {
    storeRest()
    playSound('tap')
  }

  const attack = () => {
    storeAttack()
    playSound('hit')
  }

  const currentTile = world.tiles[player.y][player.x]
  const biome = getBiomeData(currentTile.terrain)
  const description = currentTileDescription()
  const glimpses = peripheralGlimpses()
  const equipped = equippedItem()
  const skills = availableSkills()

  const inCombat = gamePhase === 'combat' && activeEnemy != null
  const canRest = player.wounds > 0
  const canAttack = inCombat && player.ap >= AP_COST_ATTACK && equipped != null
  const canFlee = inCombat && player.ap >= AP_COST_FLEE

  return (
    <div className={styles.sceneView}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <h1 className={styles.title}>{biome.name}</h1>
          <div className={styles.hud}>
            {inCombat && (
              <span className={styles.ap} data-testid="ap-display">
                AP: {player.ap}/{player.maxAp}
              </span>
            )}
            <span className={styles.wounds} data-testid="wounds-display">
              Wounds: {player.wounds}/{player.maxWounds}
            </span>
            <span className={styles.level} data-testid="level-display">Lv {player.level}</span>
            <span className={styles.xp} data-testid="xp-display">XP: {player.xp}</span>
            <button
              className={styles.muteButton}
              onClick={toggleMute}
              aria-label={soundMuted ? 'Unmute sounds' : 'Mute sounds'}
              data-testid="mute-toggle"
            >
              {soundMuted ? '🔇' : '🔊'}
            </button>
          </div>
        </div>
        {equipped && (
          <div className={styles.equippedBar} data-testid="equipped-display">
            <span className={styles.equippedLabel}>Wielding:</span> {equipped.name}
          </div>
        )}
      </header>

      <main className={styles.content}>
        <BattleStage
          terrain={currentTile.terrain}
          playerSpecies={player.species}
          activeEnemy={activeEnemy}
          legacyNpc={currentTile.legacyNpc}
          inCombat={inCombat}
        />

        <p className={styles.description} data-testid="tile-description">
          {description}
        </p>

        {currentTile.legacyNpc && !inCombat && (
          <div className={styles.legacyNpc} data-testid="legacy-npc">
            <p>
              You meet <strong>{currentTile.legacyNpc.name}</strong> the{' '}
              {SPECIES_LABELS[currentTile.legacyNpc.species]}, a retired wanderer who{' '}
              {currentTile.legacyNpc.questCompleted
                ? 'completed the great quest'
                : 'retired peacefully'}.
              They share a tale of their journey.
            </p>
          </div>
        )}

        {!inCombat && (
          <DirectionalGrid
            glimpses={glimpses}
            onMove={movePlayer}
            playerX={player.x}
            playerY={player.y}
            world={world}
          />
        )}

        {inCombat && (
          <div className={styles.combatPanel} data-testid="combat-panel">
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
          <p
            className={styles.message}
            data-testid="game-message"
            role={inCombat ? 'alert' : 'status'}
            aria-live="polite"
          >
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
              className={`${styles.actionButton} ${!canRest ? styles.disabled : ''}`}
              onClick={rest}
              disabled={!canRest}
              data-testid="rest-button"
            >
              Rest
            </button>
            <button
              className={`${styles.actionButton} ${styles.retireButton}`}
              onClick={retire}
              data-testid="retire-button"
            >
              Retire
            </button>
          </>
        )}
        {inCombat && (
          <button
            className={styles.actionButton}
            onClick={endTurn}
            data-testid="end-turn-button"
          >
            End Turn
          </button>
        )}
      </footer>
    </div>
  )
}
