# Phase 6: Polish, Art, and UX Refinements

## Branch

`feat/phase-6-polish-art` off `main`, following the git workflow in [ADR 0004](docs/adr/0004-git-workflow.md).

## Current State

Phases 1-5 are complete. The game has full world generation, movement, rest, search, items, inventory, skills, combat, character creation, progression, leaderboard, and legacy NPC systems. What remains is polish:

- **No tile art** -- MapView tiles use background colors and text symbols only
- **Minimal animations** -- one `@keyframes pulse` in MapView, basic CSS transitions on buttons/transforms; no page-turn or entrance animations
- **No audio** -- no sound effects or ambient audio
- **Limited accessibility** -- basic `aria-label` on map tiles and `role="status"` on messages, but no focus management, skip links, keyboard navigation, or `prefers-reduced-motion` support
- **No media queries** at all -- layout relies solely on flex/grid and viewport units
- **Mobile UX issues** (from [docs/todo.md](docs/todo.md)):
  - Map grid too small on mobile (20x20 tiles squeezed into viewport)
  - Action buttons overflow on narrow screens (single flex row)
  - No directional navigation from SceneView descriptions
  - Mixed terminology ("characters"/"heroes" vs "Wanderers")
  - Turn system outside combat adds unnecessary friction

## Architecture Approach

This phase is primarily CSS/UI work with some engine changes for the turn removal. Following ADR 0003, any logic changes go through engine first, then store, then UI.

---

## Task Breakdown

### 6a. Remove turns outside combat (engine + store + UI)

The turn/AP system outside combat adds friction without depth. Remove it so players can move, search, and rest freely during exploration. AP still matters in combat.

**Engine changes:**

- In [src/engine/movement.ts](src/engine/movement.ts): `movePlayer` no longer deducts AP
- In [src/engine/rest.ts](src/engine/rest.ts): `rest` no longer deducts AP
- In [src/engine/search.ts](src/engine/search.ts): `search` no longer deducts AP
- In [src/engine/types.ts](src/engine/types.ts): keep AP constants for combat use only; add a comment clarifying AP is combat-only

**Store changes:**

- In [src/stores/gameStore.ts](src/stores/gameStore.ts): remove `endTurn()` from exploration flow; AP resets to max when combat starts and is consumed during combat only; remove/hide End Turn from non-combat context

**UI changes:**

- In [src/components/SceneView/SceneView.tsx](src/components/SceneView/SceneView.tsx): remove End Turn button from non-combat actions; hide AP from exploration HUD (still show in combat)
- Remove AP-based disabling of Search/Rest/Move buttons during exploration

**Tests:** Update affected tests in `tests/engine/movement.test.ts`, `rest.test.ts`, `search.test.ts`, `tests/stores/gameStore.test.ts`

### 6b. Terminology cleanup -- "Wanderers"

Replace all instances of "character", "hero", "player" (in user-facing text) with "Wanderer" / "Wanderers".

**Files to update:**

- [src/components/IntroView/IntroView.tsx](src/components/IntroView/IntroView.tsx) -- narrative text, labels
- [src/components/RunEndView/RunEndView.tsx](src/components/RunEndView/RunEndView.tsx) -- outcome text
- [src/components/LeaderboardView/LeaderboardView.tsx](src/components/LeaderboardView/LeaderboardView.tsx) -- "Hall of Heroes" -> "Hall of Wanderers" (or keep "Hall of Heroes" if it feels better as a proper noun -- user should decide)
- [src/components/SceneView/SceneView.tsx](src/components/SceneView/SceneView.tsx) -- any player-facing text
- [src/engine/biomes.ts](src/engine/biomes.ts) -- any description text referencing "hero"

### 6c. Mobile action button layout (multi-row)

Action buttons currently use `flex: 1` in a single row, which overflows on narrow screens.

**In [src/components/SceneView/SceneView.module.css](src/components/SceneView/SceneView.module.css):**

- Change the footer actions container to a CSS Grid: `grid-template-columns: repeat(auto-fill, minmax(100px, 1fr))` to wrap into multiple rows
- Ensure buttons have `min-height: 48px` (already present) and comfortable spacing
- Group related actions: primary row (Map, Pack, Skills) and secondary row (Search, Rest, Retire)

**In combat:** similarly restructure combat action buttons to wrap properly

### 6d. Map zoom for mobile

The 20x20 grid is too small on mobile. Add a zoom toggle.

**In [src/components/MapView/MapView.tsx](src/components/MapView/MapView.tsx):**

- Add a `zoomed` state (default: `true` on mobile-width viewports)
- Zoomed view: show a 5x5 viewport centered on the player (current tile +/- 2 in each direction)
- Full view: show the entire 20x20 grid (current behavior)
- Toggle button in the MapView header: "Zoom In" / "Zoom Out"
- When zoomed, the grid tiles are larger and more tappable
- Ensure the quest marker and player position remain visible contextually (show an arrow indicator at the edge if quest marker is off-screen in zoomed mode)

**In [src/components/MapView/MapView.module.css](src/components/MapView/MapView.module.css):**

- Add styles for zoomed grid (larger tiles, bigger text)
- Smooth transition when toggling zoom

### 6e. Directional navigation from SceneView

Allow clicking on peripheral glimpse directions to move immediately.

**In [src/components/SceneView/SceneView.tsx](src/components/SceneView/SceneView.tsx):**

- Convert peripheral glimpse text items into clickable buttons/links
- Each direction button calls `movePlayer(targetX, targetY)` for that cardinal direction
- Disable/style differently if the direction is impassable
- Show terrain type in the clickable text (e.g., "North: Dense Forest" as a tappable element)

**In [src/components/SceneView/SceneView.module.css](src/components/SceneView/SceneView.module.css):**

- Style directional links as subtle, inline interactive elements (underlined or with a small arrow icon)
- Distinguish passable vs impassable directions visually

### 6f. Page-turn animations and transitions

Enhance the existing 300ms slide transition with richer, page-turn-like animations.

**In [src/styles/theme.css](src/styles/theme.css):**

- Add `@keyframes` for fade-in, slide-up entrance for view content
- Add `prefers-reduced-motion` media query that disables/simplifies animations

**In component CSS modules:**

- SceneView: staggered entrance animation for description text, glimpses, and action buttons (fade-in + slight translate-Y)
- MapView: grid tiles fade in with a brief stagger
- IntroView: narrative text types-in or fades in paragraph by paragraph
- RunEndView: hero stats reveal with a cascade effect
- Combat panel: enemy appearance animation, damage flash on HP bar

**In [src/App.module.css](src/App.module.css):**

- Enhance the scene/map slide transition with a subtle scale + opacity shift for a "depth" feel

### 6g. Accessibility pass

**Focus management:**

- In [src/App.tsx](src/App.tsx): move focus to the main content area when switching views (using `useRef` + `useEffect`)
- Add skip-to-content link at the top of the app
- Ensure all interactive elements are keyboard-navigable (tab order)

**ARIA improvements:**

- Add `aria-live="polite"` to the game message area in SceneView for screen reader announcements
- Add `aria-current="true"` to the current tile in MapView
- Add `role="alert"` for combat damage messages
- Improve map tile `aria-label` to include more context (e.g., "Forest at row 3, column 5, passable")

**Reduced motion:**

- In [src/styles/theme.css](src/styles/theme.css): add `@media (prefers-reduced-motion: reduce)` block that:
  - Sets `--transition-page: 0ms`
  - Disables all `@keyframes` animations
  - Reduces transform transitions to instant

**Keyboard shortcuts:**

- Add keyboard shortcuts for common actions: `m` for map, `i` for inventory, `s` for search, `r` for rest
- Show keyboard hints on non-touch devices

### 6h. Sound effects (optional, lightweight)

Add lightweight UI sound effects using the Web Audio API (no external library needed).

**New file: `src/utils/audio.ts`**

- Synthesize simple sounds using `AudioContext` and `OscillatorNode` (no audio files to load):
  - Button tap: short click/pop
  - Move: soft footstep tone
  - Combat hit: impact thud
  - Level up: ascending chime
  - Victory: celebratory jingle
  - Defeat: low tone
- `playSound(name)` function with a sound-enabled toggle
- Respect `prefers-reduced-motion` (no audio if reduced motion is preferred, or provide separate mute toggle)
- Store mute preference in localStorage

**UI:** Add a small mute/unmute toggle in the HUD area

### 6i. Performance optimization

- Audit and memoize expensive renders:
  - MapView grid tiles: memoize individual tile components with `React.memo`
  - SceneView peripheral glimpses: memoize text generation
- Add `will-change: transform` to the view container for GPU-accelerated transitions
- Lazy-load LeaderboardView and RunEndView (they are not needed at startup)
- Ensure CSS animations use `transform` and `opacity` only (compositor-friendly)

### 6j. ADR and documentation

- Write `docs/adr/0011-polish-accessibility.md` documenting:
  - Decision to remove turns outside combat
  - Accessibility standards targeted (WCAG 2.1 AA)
  - Sound design approach (synthesized, no assets)
  - Zoom/mobile UX decisions
- Save plan to `docs/plans/2026-03-13-phase-6-polish-art.md`

## Commit Plan

One commit per task on branch `feat/phase-6-polish-art`:

1. `feat: remove turn/AP system from exploration, keep for combat only` (6a)
2. `refactor: unify terminology to Wanderers across all UI text` (6b)
3. `feat: restructure action buttons to multi-row grid layout for mobile` (6c)
4. `feat: add map zoom toggle with 5x5 player-centered viewport` (6d)
5. `feat: add directional navigation links to SceneView glimpses` (6e)
6. `feat: add page-turn animations and staggered entrance effects` (6f)
7. `feat: accessibility pass with focus management, ARIA, and reduced motion` (6g)
8. `feat: add synthesized sound effects with mute toggle` (6h)
9. `perf: memoize map tiles, lazy-load views, optimize animations` (6i)
10. `docs: add ADR 0011 for polish and accessibility decisions` (6j)

## Key Files Modified

- `src/engine/movement.ts`, `rest.ts`, `search.ts`, `types.ts` -- turn removal
- `src/stores/gameStore.ts` -- exploration flow changes
- `src/components/SceneView/SceneView.tsx` + CSS module -- action layout, directional nav, animations
- `src/components/MapView/MapView.tsx` + CSS module -- zoom feature
- `src/components/IntroView/IntroView.tsx` -- terminology, animations
- `src/components/RunEndView/RunEndView.tsx` -- terminology, animations
- `src/components/LeaderboardView/LeaderboardView.tsx` -- terminology
- `src/styles/theme.css` -- animations, reduced motion
- `src/App.tsx` + CSS module -- focus management, view transitions, lazy loading

## New Files

- `src/utils/audio.ts` -- synthesized sound effects
- `docs/adr/0011-polish-accessibility.md`
- `docs/plans/2026-03-13-phase-6-polish-art.md`
