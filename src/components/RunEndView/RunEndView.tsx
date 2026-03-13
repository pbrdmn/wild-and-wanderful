import { useGameStore } from '../../stores/gameStore'
import { getBackSpriteStyle, SPECIES_LABELS } from '../../sprites/spriteConfig'
import styles from './RunEndView.module.css'

export function RunEndView() {
  const player = useGameStore((s) => s.player)
  const combatRounds = useGameStore((s) => s.combatRounds)
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
          {questCompleted ? 'Quest Complete!' : 'A Wanderer Retires'}
        </h1>
      </header>

      <main className={styles.content}>
        <div
          className={styles.wandererSprite}
          style={getBackSpriteStyle(player.species)}
          data-testid="wanderer-sprite"
        />

        <div className={styles.wandererInfo} data-testid="wanderer-summary">
          <h2 className={styles.wandererName}>{player.name}</h2>
          <p className={styles.wandererSpecies}>{SPECIES_LABELS[player.species]}</p>
          <div className={styles.stats}>
            <span>Level {player.level}</span>
            <span>{player.xp} XP</span>
            <span>{combatRounds} Rounds</span>
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
          Hall of Wanderers
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
