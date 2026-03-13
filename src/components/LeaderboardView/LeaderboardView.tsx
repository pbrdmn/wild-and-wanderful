import { useGameStore } from '../../stores/gameStore'
import { getBackSpriteStyle, SPECIES_LABELS } from '../../sprites/spriteConfig'
import styles from './LeaderboardView.module.css'

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
                  style={getBackSpriteStyle(entry.species)}
                />
                <div className={styles.entryInfo}>
                  <span className={styles.entryName}>{entry.name}</span>
                  <span className={styles.entryDetail}>
                    {SPECIES_LABELS[entry.species]} · Lv {entry.level} · {entry.combatRounds} rounds
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
