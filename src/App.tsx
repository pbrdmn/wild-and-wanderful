import { useEffect } from 'react'
import { useGameStore } from './stores/gameStore'
import { SceneView } from './components/SceneView'
import { MapView } from './components/MapView'
import styles from './App.module.css'

function App() {
  const view = useGameStore((s) => s.view)
  const initGame = useGameStore((s) => s.initGame)

  useEffect(() => {
    initGame()
  }, [initGame])

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
