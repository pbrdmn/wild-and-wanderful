import { useEffect } from 'react'
import { useGameStore } from './stores/gameStore'
import { SceneView } from './components/SceneView'
import { MapView } from './components/MapView'
import styles from './App.module.css'

function App() {
  const view = useGameStore((s) => s.view)
  const loaded = useGameStore((s) => s.loaded)
  const loadSavedGame = useGameStore((s) => s.loadSavedGame)
  const initGame = useGameStore((s) => s.initGame)

  useEffect(() => {
    loadSavedGame().then((restored) => {
      if (!restored) {
        initGame()
      }
    })
  }, [loadSavedGame, initGame])

  if (!loaded) {
    return (
      <div className={styles.app}>
        <div className={styles.loading} data-testid="loading">
          Loading...
        </div>
      </div>
    )
  }

  return (
    <div className={styles.app}>
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
    </div>
  )
}

export default App
