import { useGameStore } from '../../stores/gameStore'
import { getBiomeData } from '../../engine/biomes'
import { AP_COST_REST, AP_COST_SEARCH } from '../../engine/types'
import styles from './SceneView.module.css'

export function SceneView() {
  const player = useGameStore((s) => s.player)
  const world = useGameStore((s) => s.world)
  const turnNumber = useGameStore((s) => s.turnNumber)
  const gamePhase = useGameStore((s) => s.gamePhase)
  const activeEnemy = useGameStore((s) => s.activeEnemy)
  const message = useGameStore((s) => s.message)
  const setView = useGameStore((s) => s.setView)
  const endTurn = useGameStore((s) => s.endTurn)
  const rest = useGameStore((s) => s.rest)
  const search = useGameStore((s) => s.search)
  const currentTileDescription = useGameStore((s) => s.currentTileDescription)
  const peripheralGlimpses = useGameStore((s) => s.peripheralGlimpses)

  const currentTile = world.tiles[player.y][player.x]
  const biome = getBiomeData(currentTile.terrain)
  const description = currentTileDescription()
  const glimpses = peripheralGlimpses()

  const canAct = player.ap >= AP_COST_REST
  const canRest = canAct && player.wounds > 0
  const canSearch = player.ap >= AP_COST_SEARCH

  return (
    <div className={styles.sceneView}>
      <header className={styles.header}>
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
      </header>

      <main className={styles.content}>
        <p className={styles.description} data-testid="tile-description">
          {description}
        </p>

        <div className={styles.glimpses} data-testid="peripheral-glimpses">
          {glimpses.map((g) => (
            <p key={g.direction} className={styles.glimpse}>
              {g.text}
            </p>
          ))}
        </div>

        {gamePhase === 'combat' && activeEnemy && (
          <div className={styles.combatBanner} data-testid="combat-banner" role="alert">
            A {activeEnemy.name} blocks your path!
          </div>
        )}

        {message && (
          <p className={styles.message} data-testid="game-message" role="status">
            {message}
          </p>
        )}
      </main>

      <footer className={styles.actions}>
        <button
          className={styles.actionButton}
          onClick={() => setView('map')}
          data-testid="open-map-button"
        >
          Map
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
