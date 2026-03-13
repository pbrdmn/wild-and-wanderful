import { useGameStore } from '../../stores/gameStore'
import type { AnimalSpecies as AnimalSpeciesType } from '../../engine/types'
import styles from './RunEndView.module.css'

const SPECIES_LABELS: Record<AnimalSpeciesType, string> = {
  fox: 'Fox', bear: 'Bear', mouse: 'Mouse', raccoon: 'Raccoon',
  cat: 'Cat', bird: 'Bird', frog: 'Frog',
}

const BACK_SPRITE_CONFIG: Record<AnimalSpeciesType, { col: number; row: number; cols: number }> = {
  fox:     { col: 0, row: 0, cols: 3 },
  bear:    { col: 1, row: 0, cols: 3 },
  mouse:   { col: 2, row: 0, cols: 3 },
  raccoon: { col: 0, row: 1, cols: 4 },
  cat:     { col: 1, row: 1, cols: 4 },
  bird:    { col: 2, row: 1, cols: 4 },
  frog:    { col: 3, row: 1, cols: 4 },
}

function getBackSpriteStyle(species: AnimalSpeciesType): React.CSSProperties {
  const cfg = BACK_SPRITE_CONFIG[species]
  const bgSize = `${cfg.cols * 100}% 200%`
  const posX = cfg.cols > 1 ? (cfg.col / (cfg.cols - 1)) * 100 : 0
  const posY = cfg.row * 100
  return {
    backgroundImage: 'url(/characters.png)',
    backgroundSize: bgSize,
    backgroundPosition: `${posX}% ${posY}%`,
    backgroundRepeat: 'no-repeat',
  }
}

export function RunEndView() {
  const player = useGameStore((s) => s.player)
  const turnNumber = useGameStore((s) => s.turnNumber)
  const gamePhase = useGameStore((s) => s.gamePhase)
  const setView = useGameStore((s) => s.setView)
  const newGame = useGameStore((s) => s.newGame)
  const equippedItem = useGameStore((s) => s.equippedItem)

  const equipped = equippedItem()
  const questCompleted = gamePhase === 'questComplete'

  return (
    <div className={styles.runEndView}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          {questCompleted ? 'Quest Complete!' : 'A Hero Retires'}
        </h1>
      </header>

      <main className={styles.content}>
        <div
          className={styles.heroSprite}
          style={getBackSpriteStyle(player.species)}
          data-testid="hero-sprite"
        />

        <div className={styles.heroInfo} data-testid="hero-summary">
          <h2 className={styles.heroName}>{player.name}</h2>
          <p className={styles.heroSpecies}>{SPECIES_LABELS[player.species]}</p>
          <div className={styles.stats}>
            <span>Level {player.level}</span>
            <span>{player.xp} XP</span>
            <span>{turnNumber} Turns</span>
          </div>
          {equipped && (
            <p className={styles.equippedInfo}>Wielding: {equipped.name}</p>
          )}
        </div>

        <p className={styles.outcome} data-testid="run-outcome">
          {questCompleted
            ? 'You completed the great quest and your name will be sung for generations!'
            : 'You retire peacefully, your tales told by the fireside.'}
        </p>
      </main>

      <footer className={styles.actions}>
        <button
          className={styles.actionButton}
          onClick={() => setView('leaderboard')}
          data-testid="view-leaderboard-button"
        >
          Hall of Heroes
        </button>
        <button
          className={`${styles.actionButton} ${styles.newGameButton}`}
          onClick={() => newGame()}
          data-testid="new-game-button"
        >
          New Adventure
        </button>
      </footer>
    </div>
  )
}
