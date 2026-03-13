import { useState } from 'react'
import { useGameStore } from '../../stores/gameStore'
import { getBiomeSymbol } from '../../engine/biomes'
import { canMoveTo } from '../../engine/movement'
import styles from './MapView.module.css'

const ZOOM_RADIUS = 2

function getQuestDirection(
  player: { x: number; y: number },
  quest: { x: number; y: number },
): string {
  const dx = quest.x - player.x
  const dy = quest.y - player.y
  const parts: string[] = []
  if (dy < 0) parts.push('North')
  if (dy > 0) parts.push('South')
  if (dx > 0) parts.push('East')
  if (dx < 0) parts.push('West')
  return parts.join('-') || 'Here'
}

export function MapView() {
  const player = useGameStore((s) => s.player)
  const world = useGameStore((s) => s.world)
  const movePlayer = useGameStore((s) => s.movePlayer)
  const setView = useGameStore((s) => s.setView)
  const message = useGameStore((s) => s.message)
  const [selectedTile, setSelectedTile] = useState<{ x: number; y: number } | null>(null)
  const [zoomed, setZoomed] = useState(true)

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

  const viewMinX = zoomed ? Math.max(0, player.x - ZOOM_RADIUS) : 0
  const viewMaxX = zoomed ? Math.min(world.width - 1, player.x + ZOOM_RADIUS) : world.width - 1
  const viewMinY = zoomed ? Math.max(0, player.y - ZOOM_RADIUS) : 0
  const viewMaxY = zoomed ? Math.min(world.height - 1, player.y + ZOOM_RADIUS) : world.height - 1
  const viewCols = viewMaxX - viewMinX + 1
  const viewRows = viewMaxY - viewMinY + 1

  const questOffScreen = zoomed && (
    world.questMarker.x < viewMinX || world.questMarker.x > viewMaxX ||
    world.questMarker.y < viewMinY || world.questMarker.y > viewMaxY
  )
  const questDir = questOffScreen ? getQuestDirection(player, world.questMarker) : null

  return (
    <div className={styles.mapView}>
      <header className={styles.header}>
        <h1 className={styles.title}>The Map</h1>
        <button
          className={styles.zoomButton}
          onClick={() => setZoomed((z) => !z)}
          data-testid="zoom-toggle"
        >
          {zoomed ? 'Full Map' : 'Zoom In'}
        </button>
      </header>

      {questDir && (
        <p className={styles.questIndicator} data-testid="quest-direction">
          Quest: {questDir}
        </p>
      )}

      <div className={styles.gridContainer} data-testid="map-grid">
        <div
          className={`${styles.grid} ${zoomed ? styles.gridZoomed : ''}`}
          style={{
            gridTemplateColumns: `repeat(${viewCols}, 1fr)`,
            gridTemplateRows: `repeat(${viewRows}, 1fr)`,
          }}
        >
          {Array.from({ length: viewRows }, (_, ry) => {
            const y = viewMinY + ry
            return Array.from({ length: viewCols }, (_, rx) => {
              const x = viewMinX + rx
              const tile = world.tiles[y][x]
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
            })
          })}
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
