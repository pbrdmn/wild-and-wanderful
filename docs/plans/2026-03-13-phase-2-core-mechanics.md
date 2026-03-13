# Phase 2: Core Mechanics

## Branch

`feat/phase-2-core-mechanics` off `main`, following the git workflow in [ADR 0004](docs/adr/0004-git-workflow.md).

## What Already Exists

Phase 1 laid the groundwork that Phase 2 builds on:

- `Player` already has `wounds`, `maxWounds`, and `level` fields (`src/engine/types.ts`)
- `Tile` already has `hasHiddenPath`, and `canMoveTo` already respects it (`src/engine/movement.ts`)
- `idb-keyval` is already installed as a dependency
- `GamePhase` includes `'resting'` (`src/engine/types.ts`)
- `createRng` / `randomInt` in `src/engine/random.ts` available for probability rolls

## Task Breakdown

### 2a. Rest Engine Logic + Ambush Types (COMPLETED)

**New file:** `src/engine/rest.ts`

- `rest(player, rng)` -- costs 1 AP, heals 1 wound (if wounded), 10% ambush chance
- Returns a `RestResult` with: updated player, whether a wound was healed, whether an ambush was triggered, and if so an `AmbushEnemy` describing the attacker
- Ambush does **not** deal instant damage. Instead it produces enemy data and signals a transition to combat phase. The enemy gets the first turn advantage (tracked via a `enemyHasInitiative` flag). Actual combat resolution is deferred to Phase 4.
- Add `AP_COST_REST = 1` constant to `src/engine/types.ts`

**Modified file:** `src/engine/types.ts`

- Add a minimal `Enemy` interface: `{ name: string, strength: number }` -- just enough to represent what ambushed the player. The full enemy system (types, AI, loot) comes in Phase 4.
- Add an optional `activeEnemy` field to `GameState`: `activeEnemy?: Enemy & { hasInitiative: boolean }` -- set when ambushed, cleared when combat resolves in Phase 4
- This is a forward-compatible stub: Phase 4 will expand `Enemy` with HP, abilities, etc.
- **Tests:** `tests/engine/rest.test.ts` -- AP deduction, wound healing, ambush triggers enemy data (not wound), ambush enemy has `hasInitiative: true`, edge cases (no AP, already at 0 wounds)

### 2b. Search Engine Logic (COMPLETED)

**New file:** `src/engine/search.ts`

- `search(player, world, rng)` -- costs 1 AP, chance to flip an adjacent impassable tile's `hasHiddenPath` to `true`
- Finds all adjacent impassable tiles (Mountain, Swamp, Thicket), picks one at random, ~30% chance to reveal
- Returns a `SearchResult` with: updated player, updated world (if a path was found), whether a path was found, and which direction
- If no impassable tiles are adjacent, the search still costs AP but auto-fails with a flavour message
- Add `AP_COST_SEARCH = 1` constant to `src/engine/types.ts`
- **Tests:** `tests/engine/search.test.ts` -- AP deduction, hidden path reveal, no adjacent impassable tiles, seeded determinism

### 2c. Game Store Updates (COMPLETED)

**Modified file:** `src/stores/gameStore.ts`

- Add `rest()` action -- calls engine `rest()`, updates player/state, sets message ("You rest peacefully..." or "You are ambushed!"). If ambushed, sets `gamePhase: 'combat'` and stores `activeEnemy` on the state. Since combat is not implemented yet, the UI will show an ambush warning message but the player can still act (Phase 4 will gate actions during combat).
- Add `search()` action -- calls engine `search()`, updates player/world, sets message ("You found a hidden path to the East!" or "You search but find nothing...")
- Need to maintain an RNG instance in the store (seeded from the initial game seed) so rest/search rolls are deterministic in replays
- Add a `gameSeed` field to the store so the RNG can be recreated on load
- **Tests:** Update `tests/stores/gameStore.test.ts` with rest/search action tests

### 2d. Scene View UI Updates (COMPLETED)

**Modified files:** `src/components/SceneView/SceneView.tsx`, `src/components/SceneView/SceneView.module.css`

- Add wound display to the HUD header: `Wounds: 0/1` alongside AP and Turn
- Add `[Search]` and `[Rest]` buttons to the action footer (between Open Map and End Turn)
- Disable action buttons when AP < 1 (greyed-out styling with `opacity` and `pointer-events: none`)
- Rest button should be contextually disabled when player has 0 wounds (nothing to heal)
- **Tests:** Update `tests/components/SceneView.test.tsx` -- new buttons render, disabled states, wound display

### 2e. IndexedDB Persistence (COMPLETED)

**New file:** `src/utils/persistence.ts`

- `saveGame(state)` -- serialise and write to IndexedDB via `idb-keyval.set('game-save', state)`
- `loadGame()` -- read from IndexedDB via `idb-keyval.get('game-save')`, return `GameState | null`
- `clearSave()` -- delete the key via `idb-keyval.del('game-save')`
- Only persist the serialisable subset of the store: `world`, `player`, `turnNumber`, `gamePhase`, `gameSeed`, `activeEnemy`

**Modified file:** `src/stores/gameStore.ts`

- Add a Zustand `subscribe` call that auto-saves on every state change (debounced ~500ms to avoid thrashing IndexedDB)
- Modify `initGame()` to first attempt `loadGame()`; if a save exists, restore it instead of generating a new world
- Add a `newGame()` action that clears the save and starts fresh
- Add a `hasSavedGame` derived boolean for potential future use

**Modified file:** `src/App.tsx`

- Call the async load on mount; show a brief loading state while IndexedDB is read
- **Tests:** `tests/utils/persistence.test.ts` -- save/load round-trip, clearSave, missing save returns null (mock idb-keyval)

### 2f. ADR for Persistence Strategy (COMPLETED)

**New file:** `docs/adr/0005-persistence-strategy.md`

- Document the decision to use idb-keyval with Zustand subscribe for auto-save
- Note trade-offs: simplicity vs. more structured IndexedDB schemas, debounce timing

## Commit Plan

Following the one-commit-per-task convention from Phase 1:

1. `feat: add rest engine logic with wound healing and ambush-to-combat transition` (2a)
2. `feat: add search engine logic to reveal hidden paths` (2b)
3. `feat: add rest and search actions to game store with seeded RNG` (2c)
4. `feat: add wound display and search/rest buttons to Scene View` (2d)
5. `feat: add IndexedDB auto-save and load-on-startup persistence` (2e)
6. `docs: add ADR for persistence strategy` (2f)

## Key Design Decisions

- **RNG in store:** Rest and search need random rolls. Rather than creating a new RNG each time (non-deterministic), store a seeded RNG or at minimum the seed so the game is reproducible when loaded from a save.
- **Debounced auto-save:** Saving on every state change would hammer IndexedDB during rapid movement. A 500ms debounce batches rapid actions (e.g. move-move-move) into fewer writes.
- **Ambush initiates combat, not instant damage:** An ambush from resting sets `gamePhase: 'combat'` and attaches an `activeEnemy` with `hasInitiative: true`. The wound is still healed by the rest; the enemy then gets to act first when combat is implemented in Phase 4. For now the game shows the ambush message and stores the combat state, but the player is not blocked from further actions until Phase 4 adds the combat loop.
