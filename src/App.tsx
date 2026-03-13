import { useEffect } from 'react'
import { useGameStore } from './stores/gameStore'
import { SceneView } from './components/SceneView'
import { MapView } from './components/MapView'
import { IntroView } from './components/IntroView'
import { InventoryView } from './components/InventoryView'
import { SkillsView } from './components/SkillsView'
import { RunEndView } from './components/RunEndView'
import { LeaderboardView } from './components/LeaderboardView'
import styles from './App.module.css'

function App() {
  const view = useGameStore((s) => s.view)
  const gamePhase = useGameStore((s) => s.gamePhase)
  const loaded = useGameStore((s) => s.loaded)
  const loadSavedGame = useGameStore((s) => s.loadSavedGame)
  const initGame = useGameStore((s) => s.initGame)
  const loadLeaderboardAction = useGameStore((s) => s.loadLeaderboard)

  useEffect(() => {
    loadLeaderboardAction()
    loadSavedGame().then((restored) => {
      if (!restored) {
        initGame()
      }
    })
  }, [loadSavedGame, initGame, loadLeaderboardAction])

  if (!loaded) {
    return (
      <div className={styles.app}>
        <div className={styles.loading} data-testid="loading">
          Loading...
        </div>
      </div>
    )
  }

  if (view === 'leaderboard') {
    return (
      <div className={styles.app} data-testid="leaderboard-screen">
        <LeaderboardView />
      </div>
    )
  }

  if (gamePhase === 'questComplete' || gamePhase === 'retired') {
    return (
      <div className={styles.app} data-testid="run-end-screen">
        <RunEndView />
      </div>
    )
  }

  if (gamePhase === 'intro') {
    return (
      <div className={styles.app} data-testid="intro-screen">
        <IntroView />
      </div>
    )
  }

  return (
    <div className={styles.app}>
      {view === 'inventory' ? (
        <div data-testid="inventory-screen">
          <InventoryView />
        </div>
      ) : view === 'skills' ? (
        <div data-testid="skills-screen">
          <SkillsView />
        </div>
      ) : (
        <div
          className={`${styles.viewContainer} ${view === 'map' ? styles.mapActive : styles.sceneActive}`}
          data-testid="view-container"
        >
          <div className={styles.view} data-testid="scene-panel">
            <SceneView />
          </div>
          <div className={styles.view} data-testid="map-panel">
            <MapView />
          </div>
        </div>
      )}
    </div>
  )
}

export default App
