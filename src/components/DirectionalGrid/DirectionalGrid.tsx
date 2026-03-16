import { Direction, DIRECTION_OFFSETS } from '../../engine/types'
import type { World } from '../../engine/types'
import { canMoveTo } from '../../engine/movement'
import styles from './DirectionalGrid.module.css'

interface DirectionalGridProps {
  glimpses: Array<{ direction: Direction; text: string }>
  onMove: (x: number, y: number) => void
  playerX: number
  playerY: number
  world: World
}

export function DirectionalGrid({ glimpses, onMove, playerX, playerY, world }: DirectionalGridProps) {
  // Create a map of available directions for quick lookup
  const availableDirections = new Map<Direction, { text: string; x: number; y: number; isPassable: boolean }>()
  
  glimpses.forEach(g => {
    const offset = DIRECTION_OFFSETS[g.direction]
    const tx = playerX + offset.dx
    const ty = playerY + offset.dy
    const tile = world.tiles[ty][tx]
    const isPassable = canMoveTo(tile)
    availableDirections.set(g.direction, { text: g.text, x: tx, y: ty, isPassable })
  })

  const handleDirectionClick = (direction: Direction) => {
    const target = availableDirections.get(direction)
    if (target && target.isPassable) {
      onMove(target.x, target.y)
    }
  }

  return (
    <div className={styles.directionalGrid} role="group" aria-label="Movement directions" data-testid="peripheral-glimpses">
      <div className={styles.northRow}>
        <DirectionButton
          direction="north"
          label="North"
          onClick={() => handleDirectionClick(Direction.North)}
          isAvailable={availableDirections.has(Direction.North) && !!availableDirections.get(Direction.North)?.isPassable}
          text={availableDirections.get(Direction.North)?.text}
        />
      </div>
      
      <div className={styles.middleRow}>
        <DirectionButton
          direction="west"
          label="West"
          onClick={() => handleDirectionClick(Direction.West)}
          isAvailable={availableDirections.has(Direction.West) && !!availableDirections.get(Direction.West)?.isPassable}
          text={availableDirections.get(Direction.West)?.text}
        />
        <DirectionButton
          direction="east"
          label="East"
          onClick={() => handleDirectionClick(Direction.East)}
          isAvailable={availableDirections.has(Direction.East) && !!availableDirections.get(Direction.East)?.isPassable}
          text={availableDirections.get(Direction.East)?.text}
        />
      </div>
      
      <div className={styles.southRow}>
        <DirectionButton
          direction="south"
          label="South"
          onClick={() => handleDirectionClick(Direction.South)}
          isAvailable={availableDirections.has(Direction.South) && !!availableDirections.get(Direction.South)?.isPassable}
          text={availableDirections.get(Direction.South)?.text}
        />
      </div>
    </div>
  )
}

interface DirectionButtonProps {
  direction: 'north' | 'east' | 'south' | 'west'
  label: string
  onClick: () => void
  isAvailable: boolean
  text?: string
}

function DirectionButton({ direction, label, onClick, isAvailable, text }: DirectionButtonProps) {
  const buttonText = text ? text.replace(/^[→←↑↓]/, '').trim() : label
  
  return (
    <button
      className={`${styles.directionButton} ${styles[`direction-${direction}`]} ${!isAvailable ? styles.blocked : ''}`}
      onClick={onClick}
      disabled={!isAvailable}
      aria-label={isAvailable ? `Move ${label}` : `${label} (blocked)`}
      title={isAvailable ? buttonText : `${label}: ${buttonText}`}
      role="gridcell"
    >
      <span className={styles.directionIcon} aria-hidden="true">
        {getDirectionIcon(direction)}
      </span>
      <span className={styles.directionLabel}>{label}</span>
      <span className={styles.directionText}>{buttonText}</span>
    </button>
  )
}

function getDirectionIcon(direction: string): string {
  switch (direction) {
    case 'north': return '↑'
    case 'east': return '→'
    case 'south': return '↓'
    case 'west': return '←'
    default: return ''
  }
}