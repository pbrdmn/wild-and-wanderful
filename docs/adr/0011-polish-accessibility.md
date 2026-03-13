# 0011 - Polish, Accessibility, and UX Decisions

**Status:** Accepted
**Date:** 2026-03-13

## Context

Phase 6 is the final phase before the game is feature-complete. It addresses polish, art, accessibility, and several UX refinements identified during playtesting and captured in `docs/todo.md`.

Key issues:

- The turn/AP system outside combat adds friction without tactical depth.
- Mixed terminology ("hero", "character", "player") creates inconsistency.
- Action buttons overflow on mobile in a single row.
- The 20x20 map grid is too small to interact with on mobile.
- No directional movement from the scene description view.
- Minimal animations and no entrance effects.
- No accessibility support beyond basic ARIA labels.
- No audio feedback for player actions.

## Decision

### Turns removed from exploration

AP and the End Turn button are now exclusive to combat. Movement, search, and rest are free actions during exploration. AP resets to max when combat starts. This removes unnecessary friction and lets players explore at their own pace while preserving tactical depth where it matters.

### Terminology: Wanderers

All user-facing text uses "Wanderer" / "Wanderers" consistently, replacing the mixed use of "hero", "character", and "player" in UI text.

### Mobile action button layout

Replaced the single-row flex layout with CSS Grid using `repeat(auto-fill, minmax(100px, 1fr))`, which wraps buttons into multiple rows on narrow screens.

### Map zoom

Added a zoom toggle that defaults to a 5x5 viewport centered on the player. When zoomed, tiles are larger and more tappable. A directional indicator shows the quest marker direction when it's off-screen.

### Directional navigation

Peripheral glimpses in SceneView are now clickable for passable directions, allowing direct movement without opening the map.

### Animations

Added `fadeSlideIn` and `fadeIn` keyframe animations with staggered delays across all major views. All animations respect `prefers-reduced-motion: reduce` via a global media query that disables transitions and animations.

### Accessibility (WCAG 2.1 AA target)

- Skip-to-content link
- Focus management on view changes
- Keyboard shortcuts (m, i, s, r) during exploration
- `aria-live="polite"` on game messages, `role="alert"` for combat
- `aria-current` on the player's map tile
- Richer map tile labels with row/column numbers and passability
- `prefers-reduced-motion` support

### Sound design

Synthesized sounds using the Web Audio API (`OscillatorNode` + `GainNode`). No audio files needed, keeping the app fully offline-capable with zero additional asset downloads. Mute preference persists in localStorage. Sounds are short, subtle, and non-intrusive.

### Performance

- `React.memo` on individual map tiles to avoid full-grid re-renders
- Lazy-loaded `RunEndView` and `LeaderboardView` via `React.lazy` + `Suspense`
- `will-change: transform` on the view container for GPU compositing

## Consequences

- Removing turns from exploration is a gameplay design change that cannot be easily reversed without re-adding the turn system and AP costs to engine functions. However, the AP system is fully preserved for combat.
- Synthesized audio will sound different across browsers due to varying Web Audio API implementations; this is acceptable for UI feedback sounds.
- Lazy loading adds a brief flash for the first load of leaderboard/run-end views; the fallback loading state handles this gracefully.
- Keyboard shortcuts only fire during exploration and do not conflict with form inputs.
