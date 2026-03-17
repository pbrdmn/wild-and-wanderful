import { useGameStore } from '../../stores/gameStore'
import styles from './BattleActions.module.css'

export function BattleActions() {
  const player = useGameStore((s) => s.player)
  const activeEnemy = useGameStore((s) => s.activeEnemy)
  const gamePhase = useGameStore((s) => s.gamePhase)
  const combatLog = useGameStore((s) => s.combatLog)
  const playerTurn = useGameStore((s) => s.playerTurn)
  const attack = useGameStore((s) => s.attack)
  const flee = useGameStore((s) => s.flee)
  const openInventory = useGameStore((s) => s.openInventory)
  const endTurn = useGameStore((s) => s.endTurn)
  const message = useGameStore((s) => s.message)

  if (gamePhase !== 'combat' || !activeEnemy) {
    return null
  }

  const canAttack = player.ap >= 1 && playerTurn
  const canFlee = player.ap >= 1 && playerTurn
  const canOpenInventory = player.ap >= 1 && playerTurn
  const canEndTurn = playerTurn

  return (
    <div className={styles.battleActions} data-testid="battle-actions">
      <div className={styles.statusBar}>
        <div className={styles.playerStatus}>
          <span className={styles.statusLabel}>HP:</span>
          <span className={styles.statusValue}>{player.hp}/{player.maxHp}</span>
          <span className={styles.statusLabel} style={{ marginLeft: '1rem' }}>AP:</span>
          <span className={styles.statusValue}>{player.ap}/{player.maxAp}</span>
        </div>
        <div className={styles.enemyStatus}>
          <span className={styles.statusLabel}>{activeEnemy.name} HP:</span>
          <span className={styles.statusValue}>{activeEnemy.hp}/{activeEnemy.maxHp}</span>
        </div>
      </div>

      <div className={styles.turnIndicator}>
        {playerTurn ? (
          <div className={styles.yourTurn}>Your Turn</div>
        ) : (
          <div className={styles.enemyTurn}>Enemy's Turn</div>
        )}
      </div>

      <div className={styles.actionButtons}>
        <button
          className={`${styles.actionBtn} ${canAttack ? styles.btnEnabled : styles.btnDisabled}`}
          onClick={attack}
          disabled={!canAttack}
          data-testid="attack-button"
        >
          Attack
          <span className={styles.apCost}>(1 AP)</span>
        </button>

        <button
          className={`${styles.actionBtn} ${canFlee ? styles.btnEnabled : styles.btnDisabled}`}
          onClick={flee}
          disabled={!canFlee}
          data-testid="flee-button"
        >
          Flee
          <span className={styles.apCost}>(1 AP)</span>
        </button>

        <button
          className={`${styles.actionBtn} ${canOpenInventory ? styles.btnEnabled : styles.btnDisabled}`}
          onClick={openInventory}
          disabled={!canOpenInventory}
          data-testid="inventory-button"
        >
          Change Items
          <span className={styles.apCost}>(1 AP)</span>
        </button>

        <button
          className={`${styles.actionBtn} ${canEndTurn ? styles.btnEnabled : styles.btnDisabled}`}
          onClick={endTurn}
          disabled={!canEndTurn}
          data-testid="end-turn-button"
        >
          End Turn
          <span className={styles.apCost}>(0 AP)</span>
        </button>
      </div>

      <div className={styles.combatLog}>
        <div className={styles.logHeader}>Combat Log</div>
        <div className={styles.logContent}>
          {combatLog.map((log, index) => (
            <div key={index} className={styles.logEntry}>
              {log}
            </div>
          ))}
        </div>
      </div>

      {message && (
        <div className={styles.message} data-testid="battle-message" role="status">
          {message}
        </div>
      )}
    </div>
  )
}
