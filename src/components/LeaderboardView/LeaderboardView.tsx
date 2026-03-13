import { useGameStore } from '../../stores/gameStore'
import type { AnimalSpecies as AnimalSpeciesType } from '../../engine/types'
import styles from './LeaderboardView.module.css'

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

function getSmallSpriteStyle(species: AnimalSpeciesType): React.CSSProperties {
  const cfg = BACK_SPRITE_CONFIG[species] ?? BACK_SPRITE_CONFIG.fox
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

export function LeaderboardView() {
  const leaderboard = useGameStore((s) => s.leaderboard)
  const gamePhase = useGameStore((s) => s.gamePhase)
  const setView = useGameStore((s) => s.setView)
  const newGame = useGameStore((s) => s.newGame)

  const canGoBack = gamePhase === 'intro' || gamePhase === 'questComplete' || gamePhase === 'retired'

  return (
    <div className={styles.leaderboardView}>
      <header className={styles.header}>
        <h1 className={styles.title}>Hall of Wanderers</h1>
      </header>

      <main className={styles.content}>
        {leaderboard.length === 0 ? (
          <p className={styles.empty} data-testid="leaderboard-empty">
            No wanderers have been recorded yet. Complete a quest or retire to be remembered!
          </p>
        ) : (
          <ol className={styles.list} data-testid="leaderboard-list">
            {leaderboard.map((entry, i) => (
              <li key={entry.id} className={styles.entry} data-testid={`leaderboard-entry-${i}`}>
                <span className={styles.rank}>{i + 1}</span>
                <div
                  className={styles.entrySprite}
                  style={getSmallSpriteStyle(entry.species)}
                />
                <div className={styles.entryInfo}>
                  <span className={styles.entryName}>{entry.name}</span>
                  <span className={styles.entryDetail}>
                    {SPECIES_LABELS[entry.species]} · Lv {entry.level} · {entry.turnsSurvived} turns
                  </span>
                </div>
                <span className={`${styles.outcome} ${entry.questCompleted ? styles.quest : styles.retired}`}>
                  {entry.questCompleted ? 'Quest' : 'Retired'}
                </span>
              </li>
            ))}
          </ol>
        )}
      </main>

      <footer className={styles.actions}>
        {canGoBack && (
          <button
            className={styles.actionButton}
            onClick={() => setView(gamePhase === 'intro' ? 'intro' : 'runEnd')}
            data-testid="leaderboard-back-button"
          >
            Back
          </button>
        )}
        <button
          className={`${styles.actionButton} ${styles.newGameButton}`}
          onClick={() => newGame()}
          data-testid="leaderboard-new-game-button"
        >
          New Adventure
        </button>
      </footer>
    </div>
  )
}
