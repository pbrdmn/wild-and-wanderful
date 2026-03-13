# 0005 - Game State Persistence Strategy

**Status:** Accepted
**Date:** 2026-03-13

## Context
The game needs to save progress automatically so players can close the browser and resume later. All state lives client-side (offline-first). We need a mechanism that is simple to implement, reliable, and does not noticeably impact gameplay performance.

## Decision
- Use **idb-keyval** to read/write a single IndexedDB key (`game-save`) containing the serialisable game state
- Auto-save via a **Zustand subscribe** callback that fires on every state change, **debounced at 500ms** to batch rapid actions into fewer writes
- On app startup, attempt to load the saved game; if a save exists, restore it instead of generating a new world
- Expose `newGame()` to clear the save and start fresh
- Persist only the serialisable subset: `world`, `player`, `turnNumber`, `gamePhase`, `activeEnemy`, `gameSeed`
- The action RNG is re-seeded from `gameSeed + 1 + turnNumber` on load to avoid replaying the exact same random sequence

## Consequences
- Simple single-key storage is easy to reason about but does not support multiple save slots or incremental diffs
- The 500ms debounce means a crash within that window could lose the most recent action (acceptable for a casual game)
- Serialising the full 20x20 tile grid on every save is a few KB; well within IndexedDB performance for this data size
- Future phases may need to expand the persisted data (e.g. inventory, skill tree) by adding fields to `SaveData`
- If the save schema changes between versions, a migration step will be needed (not yet implemented)
