import { useState } from 'react'
import { useGameStore } from '../../stores/gameStore'
import { getBiomeData } from '../../engine/biomes'
import { SPECIES_LABELS } from '../../sprites/spriteConfig'
import { playSound, isMuted, setMuted } from '../../utils/audio'
import { BattleStage } from '../BattleStage/BattleStage'
import { DirectionalGrid } from '../DirectionalGrid'
import { BattleActions } from '../BattleActions'
import styles from './SceneView.module.css'

export function SceneView() {
  const player = useGameStore((s) => s.player)
  const world = useGameStore((s) => s.world)
  const gamePhase = useGameStore((s) => s.gamePhase)
  const activeEnemy = useGameStore((s) => s.activeEnemy)
  const message = useGameStore((s) => s.message)
  const setView = useGameStore((s) => s.setView)
  const endTurn = useGameStore((s) => s.endTurn)
  const storeRest = useGameStore((s) => s.rest)
  const retire = useGameStore((s) => s.retire)
  const currentTileDescription = useGameStore((s) => s.currentTileDescription)
  const peripheralGlimpses = useGameStore((s) => s.peripheralGlimpses)
  const storeMove = useGameStore((s) => s.movePlayer)
  const equippedItem = useGameStore((s) => s.equippedItem)

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


  const rest = () => {
    storeRest()
    playSound('tap')
  }


  const currentTile = world.tiles[player.y][player.x]
  const biome = getBiomeData(currentTile.terrain)
  const description = currentTileDescription()
  const glimpses = peripheralGlimpses()
  const equipped = equippedItem()

  const inCombat = gamePhase === 'combat' && activeEnemy != null
  const canRest = player.hp < player.maxHp

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
            <span className={styles.wounds} data-testid="hp-display">
              HP: {player.hp}/{player.maxHp}
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
          <BattleActions />
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
      </footer>
    </div>
  )
}
