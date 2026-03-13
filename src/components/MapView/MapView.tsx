import { useGameStore } from '../../stores/gameStore'
import { getBiomeSymbol } from '../../engine/biomes'
import { canMoveTo } from '../../engine/movement'
import styles from './MapView.module.css'

export function MapView() {
  const player = useGameStore((s) => s.player)
  const world = useGameStore((s) => s.world)
  const movePlayer = useGameStore((s) => s.movePlayer)
  const setView = useGameStore((s) => s.setView)
  const message = useGameStore((s) => s.message)

  const isAdjacent = (x: number, y: number) => {
    const dx = Math.abs(x - player.x)
    const dy = Math.abs(y - player.y)
    return (dx + dy) === 1
  }

  const handleTileClick = (x: number, y: number) => {
    if (!isAdjacent(x, y)) return
    const tile = world.tiles[y][x]
    if (!canMoveTo(tile)) return
    if (player.ap < 1) return
    movePlayer(x, y)
  }

  return (
    <div className={styles.mapView}>
      <header className={styles.header}>
        <h1 className={styles.title}>The Map</h1>
        <div className={styles.hud}>
          <span className={styles.ap} data-testid="map-ap-display">
            AP: {player.ap}/{player.maxAp}
          </span>
        </div>
      </header>

      <div className={styles.gridContainer} data-testid="map-grid">
        <div
          className={styles.grid}
          style={{
            gridTemplateColumns: `repeat(${world.width}, 1fr)`,
            gridTemplateRows: `repeat(${world.height}, 1fr)`,
          }}
        >
          {world.tiles.map((row, y) =>
            row.map((tile, x) => {
              const isPlayer = player.x === x && player.y === y
              const isQuest = world.questMarker.x === x && world.questMarker.y === y
              const adj = isAdjacent(x, y)
              const movable = adj && canMoveTo(tile) && player.ap >= 1

              let cellClass = styles.tile
              if (!tile.isExplored && !isQuest) cellClass += ` ${styles.fog}`
              if (isPlayer) cellClass += ` ${styles.player}`
              if (adj && tile.isExplored) cellClass += ` ${styles.adjacent}`
              if (movable) cellClass += ` ${styles.movable}`

              return (
                <button
                  key={`${x}-${y}`}
                  className={cellClass}
                  onClick={() => handleTileClick(x, y)}
                  disabled={!movable}
                  data-testid={`tile-${x}-${y}`}
                  data-explored={tile.isExplored}
                  data-terrain={tile.terrain}
                  aria-label={
                    isPlayer
                      ? 'Your position'
                      : tile.isExplored
                        ? `${tile.terrain} at ${x},${y}`
                        : isQuest
                          ? 'Quest marker'
                          : 'Unexplored'
                  }
                >
                  {isPlayer ? (
                    <span className={styles.playerIcon}>@</span>
                  ) : isQuest ? (
                    <span className={styles.questIcon}>X</span>
                  ) : tile.isExplored ? (
                    <span className={styles.biomeIcon}>{getBiomeSymbol(tile.terrain)}</span>
                  ) : null}
                </button>
              )
            }),
          )}
        </div>
      </div>

      {message && (
        <p className={styles.message} data-testid="map-message" role="status">
          {message}
        </p>
      )}

      <footer className={styles.actions}>
        <button
          className={styles.actionButton}
          onClick={() => setView('scene')}
          data-testid="back-to-scene-button"
        >
          Back to Scene
        </button>
      </footer>
    </div>
  )
}
