import { useEffect, useRef, useCallback } from 'react'
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
  const setView = useGameStore((s) => s.setView)
  const search = useGameStore((s) => s.search)
  const rest = useGameStore((s) => s.rest)

  const mainRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadLeaderboardAction()
    loadSavedGame().then((restored) => {
      if (!restored) {
        initGame()
      }
    })
  }, [loadSavedGame, initGame, loadLeaderboardAction])

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.focus()
    }
  }, [view, gamePhase])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (gamePhase !== 'exploring') return
    const tag = (e.target as HTMLElement).tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA') return

    switch (e.key) {
      case 'm':
        e.preventDefault()
        setView(view === 'map' ? 'scene' : 'map')
        break
      case 'i':
        e.preventDefault()
        setView(view === 'inventory' ? 'scene' : 'inventory')
        break
      case 's':
        e.preventDefault()
        search()
        break
      case 'r':
        e.preventDefault()
        rest()
        break
    }
  }, [gamePhase, view, setView, search, rest])

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
      <div className={styles.app} data-testid="leaderboard-screen" ref={mainRef} tabIndex={-1} onKeyDown={handleKeyDown}>
        <a href="#main-content" className={styles.skipLink}>Skip to content</a>
        <div id="main-content">
          <LeaderboardView />
        </div>
      </div>
    )
  }

  if (gamePhase === 'questComplete' || gamePhase === 'retired') {
    return (
      <div className={styles.app} data-testid="run-end-screen" ref={mainRef} tabIndex={-1} onKeyDown={handleKeyDown}>
        <a href="#main-content" className={styles.skipLink}>Skip to content</a>
        <div id="main-content">
          <RunEndView />
        </div>
      </div>
    )
  }

  if (gamePhase === 'intro') {
    return (
      <div className={styles.app} data-testid="intro-screen" ref={mainRef} tabIndex={-1} onKeyDown={handleKeyDown}>
        <a href="#main-content" className={styles.skipLink}>Skip to content</a>
        <div id="main-content">
          <IntroView />
        </div>
      </div>
    )
  }

  return (
    <div className={styles.app} ref={mainRef} tabIndex={-1} onKeyDown={handleKeyDown}>
      <a href="#main-content" className={styles.skipLink}>Skip to content</a>
      <div id="main-content">
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
    </div>
  )
}

export default App
