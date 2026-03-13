# Wild and Wanderful: Incremental Build Plan

## Tech Stack (Confirmed)

- **Framework:** React 19 + TypeScript + Vite
- **Styling:** CSS Modules + CSS custom properties for theming
- **State:** Zustand (game state) + idb-keyval (IndexedDB persistence)
- **PWA:** vite-plugin-pwa (service worker, manifest, offline caching)
- **Testing:** Vitest + React Testing Library
- **Linting:** ESLint + Prettier (via Vite defaults)

## Git Workflow

Each phase gets its own feature branch off `main`. Each task within a phase gets a descriptive commit. The branch is merged (or ready to merge) to `main` before starting the next phase.

- **Phase 1:** `feat/phase-1-scaffolding-scene-movement`
- **Phase 2:** `feat/phase-2-core-mechanics`
- **Phase 3:** `feat/phase-3-items-inventory`
- **Phase 4:** `feat/phase-4-skills-combat`
- **Phase 5:** `feat/phase-5-legacy-progression`
- **Phase 6:** `feat/phase-6-polish-art`

### Phase 1 Commits (one per task)

1. `feat: scaffold Vite + React + TS project with PWA config and theme` (1a)
2. `feat: add game type definitions for tiles, world, player, and state` (1b)
3. `feat: implement world generation with biome clustering and tests` (1c)
4. `feat: add biome text descriptions and peripheral glimpses with tests` (1d)
5. `feat: implement movement logic with adjacency, passability, and AP cost with tests` (1e)
6. `feat: add Zustand game store with init, move, and end-turn actions with tests` (1f)
7. `feat: implement Scene View component with descriptions and HUD with tests` (1g)
8. `feat: implement Map View component with grid, fog of war, and tap-to-move with tests` (1h)
9. `feat: add app shell with view switching and page transition animations` (1i)

## Architecture Decision Records (ADRs)

Decisions are documented as lightweight ADRs in `docs/adr/` using the format `NNNN-title.md`. Each ADR captures context, decision, and consequences. ADRs are committed alongside the code they relate to.

### Initial ADRs (committed during Phase 1a scaffolding)

- `0001-tech-stack.md` — React 19 + TypeScript + Vite, CSS Modules, Zustand + IndexedDB
- `0002-offline-first-pwa.md` — vite-plugin-pwa, service worker strategy, manifest config
- `0003-game-engine-separation.md` — Pure TS engine modules decoupled from React
- `0004-git-workflow.md` — Feature branch per phase, one commit per task

### ADR Template (`docs/adr/template.md`)

```markdown
# NNNN - Title

**Status:** Accepted | Superseded | Deprecated
**Date:** YYYY-MM-DD

## Context
What is the issue or question?

## Decision
What was decided and why?

## Consequences
What are the trade-offs and implications?
```

Further ADRs are added as new decisions arise in later phases (e.g., combat system design, persistence strategy, art pipeline).

## Architecture Principles

- **Separation of concerns:** Pure TypeScript modules for all game logic (world generation, rules, AP calculations). React components are thin rendering layers.
- **Testability:** Game logic is framework-agnostic and unit-testable without React. UI tests use React Testing Library.
- **Offline-first from day one:** PWA manifest and service worker configured in Phase 1.

## Project Structure

```
src/
  engine/           # Pure TS game logic (no React)
    world.ts        # World/grid generation
    types.ts        # All game types/interfaces
    biomes.ts       # Biome definitions and descriptions
    movement.ts     # Movement rules, adjacency, AP cost
  stores/
    gameStore.ts    # Zustand store for game state
  components/
    SceneView/      # Main scene description view
    MapView/        # Grid map for navigation
    HUD/            # AP display, action buttons
    App.tsx
  styles/
    theme.css       # CSS custom properties (color palette, typography)
  utils/
    persistence.ts  # IndexedDB save/load via idb-keyval
  main.tsx
  index.html
public/
  manifest.json     # PWA manifest
tests/
  engine/           # Unit tests for game logic
  components/       # Component integration tests
```

## Theming (CSS Custom Properties)

A cozy palette defined in `theme.css`, consumed by CSS Modules:

- `--color-parchment`: warm cream background
- `--color-forest`: muted green for forests
- `--color-meadow`: soft yellow-green
- `--color-water`: gentle blue
- `--color-earth`: warm brown
- `--color-text`: dark charcoal
- `--color-accent`: muted orange
- `--font-body`: serif body font (e.g., Lora or Libre Baskerville)
- `--font-heading`: display font for titles

---

## Phase 1: Scaffolding + Scene View + Movement (COMPLETED)

The smallest playable slice: a generated world you can walk around and read descriptions of.

### 1a. Project Scaffolding

- Scaffold Vite + React + TypeScript project
- Configure CSS Modules in Vite (works out of the box)
- Install dependencies: `zustand`, `idb-keyval`, `vite-plugin-pwa`
- Install dev dependencies: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`
- Set up `theme.css` with CSS custom properties for the cozy palette
- Configure PWA manifest (app name, icons placeholder, theme color, display: standalone)
- Configure service worker via vite-plugin-pwa (precache app shell)
- Add viewport meta tag for mobile portrait orientation
- Create `docs/adr/template.md` and initial ADRs (0001-0004)

### 1b. Type Definitions (`src/engine/types.ts`)

- `TerrainType`: enum (Forest, Meadow, River, Lake, Road, Village, Mountain, Swamp, Thicket)
- `Tile`: `{ x: number, y: number, terrain: TerrainType, isExplored: boolean, hasHiddenPath: boolean }`
- `World`: `{ width: number, height: number, tiles: Tile[][] }`
- `Player`: `{ x: number, y: number, ap: number, maxAp: number, name: string }`
- `GameState`: `{ world: World, player: Player, turnNumber: number, gamePhase: 'exploring' | 'combat' | 'resting' }`

### 1c. World Generation (`src/engine/world.ts`)

- Generate a 20x20 grid with seeded random biome distribution
- Simple noise-based approach: cluster biomes naturally (forests adjacent to meadows, rivers flow, etc.)
- Place one Village tile as the starting location
- Place a quest marker ("X") in a distant quadrant from start
- Mark the starting tile as `isExplored: true`
- **Tests:** Verify grid dimensions, starting village exists, quest marker exists, biome distribution is reasonable

### 1d. Biome Descriptions (`src/engine/biomes.ts`)

- Map each `TerrainType` to a set of text descriptions (2-3 variants per biome for variety)
- Include peripheral glimpse text (short, directional descriptions: "To the North, dense forest rises...")
- **Tests:** Every terrain type has at least one description and one peripheral glimpse

### 1e. Movement Logic (`src/engine/movement.ts`)

- `getAdjacentTiles(x, y, world)`: returns valid adjacent tiles (N/E/S/W, no diagonals)
- `canMoveTo(tile)`: checks terrain passability (Mountains, Swamps, Thickets are impassable without hidden path)
- `movePlayer(player, targetX, targetY)`: deducts 1 AP, updates position, marks tile explored
- `endTurn(player)`: resets AP to maxAp, increments turn counter
- **Tests:** Adjacency calculation, impassable terrain blocking, AP deduction, boundary checks

### 1f. Zustand Game Store (`src/stores/gameStore.ts`)

- State: `GameState` (world, player, turn number, game phase)
- Actions: `initGame()`, `movePlayer(x, y)`, `endTurn()`
- Derive: current tile, adjacent tiles, peripheral descriptions
- **Tests:** Store actions produce correct state transitions

### 1g. Scene View Component (`src/components/SceneView/`)

- Displays the current tile's text description (rich, atmospheric prose)
- Shows "Peripheral Glimpses" — one line for each cardinal direction describing what lies there
- Action buttons: [Map], [End Turn]
- AP display in a minimal HUD
- Mobile-first layout: single column, comfortable tap targets
- **Tests:** Renders description text, shows correct peripheral glimpses, buttons are present

### 1h. Map View Component (`src/components/MapView/`)

- Renders the 20x20 grid; only explored tiles are visible, unexplored tiles are "fog of war"
- Current player position highlighted
- Quest marker ("X") shown at its location (visible even if unexplored, like a compass bearing)
- Tap an adjacent tile to move there (calls `movePlayer`)
- [Back to Scene] button to return
- Mobile-optimized: grid fits portrait viewport, pinch-to-zoom not needed at 20x20
- **Tests:** Renders grid, fog of war for unexplored tiles, clicking adjacent tile triggers move

### 1i. App Shell & Navigation

- Single `App.tsx` managing which view is active (Scene or Map)
- Simple state toggle, no router needed
- Page transitions: CSS fade/slide animation between views (the "turning a page" feel)

### Phase 1 Deliverable

A playable loop: open the app, see a scene description of your starting village, open the map, tap adjacent tiles to explore, see new descriptions, manage your AP, end turns. Works offline as a PWA.

---

## Phase 2: Core Mechanics (Next)

- Rest mechanic: restore 1 wound, 10% ambush chance, costs 1 AP
- Search mechanic: 1 AP, chance to reveal hidden paths through impassable terrain
- Wound system: wound slots (1 per level), replace HP
- Add [Search] and [Rest] buttons to Scene View
- Persist game state to IndexedDB on every state change (auto-save)
- Load saved game on app startup

## Phase 3: Items, Inventory & Starting Narrative

- Item type definitions (Sword, Bow, Wand with stats)
- Inventory system (equip/unequip, limited slots)
- Inventory UI (accessible from Scene View)
- Starting narrative: NPC offers choice of 3 heirlooms
- Full-turn swap mechanic (changing equipment costs all AP)

## Phase 4: Skills & Combat

- Skill tree data model (item-locked skills, active slot limits)
- Enemy types and placement during world generation
- Turn-based combat flow (player turn -> enemy turn)
- Combat UI within Scene View
- Status effects (Daze, etc.)

## Phase 5: Legacy & Progression

- Leaderboard for retired/completed heroes
- Legacy NPCs: retired heroes appear in future playthroughs
- Character naming and animal species selection
- Level-up system (unlock wound slots, skill slots)

## Phase 6: Polish & Art

- Art asset integration (character portraits, tile art)
- Page-turn animations and transitions
- Sound effects and ambient audio (optional)
- Accessibility pass (screen reader, reduced motion)
- Performance optimization for low-end mobile
