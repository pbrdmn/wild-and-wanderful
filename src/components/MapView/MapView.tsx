import { useState } from 'react'
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
  const [selectedTile, setSelectedTile] = useState<{ x: number; y: number } | null>(null)

  const isAdjacent = (x: number, y: number) => {
    const dx = Math.abs(x - player.x)
    const dy = Math.abs(y - player.y)
    return (dx + dy) === 1
  }

  const isPlayerTile = (x: number, y: number) =>
    player.x === x && player.y === y

  const handleTileClick = (x: number, y: number) => {
    if (selectedTile?.x === x && selectedTile?.y === y) {
      setSelectedTile(null)
      return
    }

    if (isPlayerTile(x, y)) {
      setSelectedTile({ x, y })
      return
    }

    if (!isAdjacent(x, y)) return
    const tile = world.tiles[y][x]
    if (!canMoveTo(tile)) return
    setSelectedTile({ x, y })
  }

  const canTravel = selectedTile != null && !isPlayerTile(selectedTile.x, selectedTile.y)

  const handleTravel = () => {
    if (!canTravel) return
    movePlayer(selectedTile.x, selectedTile.y)
    setSelectedTile(null)
    setView('scene')
  }

  return (
    <div className={styles.mapView}>
      <header className={styles.header}>
        <h1 className={styles.title}>The Map</h1>
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
              const isPlayer = isPlayerTile(x, y)
              const isQuest = world.questMarker.x === x && world.questMarker.y === y
              const adj = isAdjacent(x, y)
              const visible = tile.isExplored || adj || isPlayer
              const movable = adj && canMoveTo(tile)
              const clickable = movable || isPlayer

              const isSelected = selectedTile?.x === x && selectedTile?.y === y

              let cellClass = styles.tile
              if (!visible && !isQuest) cellClass += ` ${styles.fog}`
              if (isPlayer) cellClass += ` ${styles.player}`
              if (isSelected) cellClass += ` ${styles.selected}`
              if (adj) cellClass += ` ${styles.adjacent}`
              if (clickable) cellClass += ` ${styles.movable}`

              return (
                <button
                  key={`${x}-${y}`}
                  className={cellClass}
                  onClick={() => handleTileClick(x, y)}
                  disabled={!clickable}
                  data-testid={`tile-${x}-${y}`}
                  data-explored={tile.isExplored}
                  data-visible={visible}
                  data-terrain={tile.terrain}
                  aria-label={
                    isPlayer
                      ? 'Your position'
                      : visible
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
                  ) : visible ? (
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
          className={`${styles.actionButton} ${styles.travelButton}`}
          onClick={handleTravel}
          disabled={!canTravel}
          data-testid="travel-button"
        >
          Travel
        </button>
        <button
          className={styles.actionButton}
          onClick={() => setView('scene')}
          data-testid="close-map-button"
        >
          Close Map
        </button>
      </footer>
    </div>
  )
}
