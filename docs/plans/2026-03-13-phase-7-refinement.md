# Phase 7: Refinement

## Items Already Done

- **Map zoom (original item 1)**: MapView has zoom with `ZOOM_RADIUS = 2`, defaulting to zoomed, showing a 5x5 grid.
- **Clickable directions (item 3)**: SceneView renders passable glimpses as clickable buttons.
- **Action button layout (item 2)**: Confirmed acceptable as-is.

## Item 1: Immediate Map Travel

Since movement is free (no AP cost), the Travel button adds unnecessary friction. Clicking an adjacent passable tile on the map should immediately move the player and close the map.

### Changes
- Remove `selectedTile` state, `canTravel`, `handleTravel` from MapView
- Click adjacent passable tile -> `movePlayer(x, y)` + `setView('scene')` immediately
- Remove Travel button from footer; keep only Close Map
- Update MapView tests

## Item 4: Rename "hero" / "character" to "Wanderer"

Consistent terminology across code, CSS, and tests. Asset filenames stay as-is.

### Changes
- `setCharacter` -> `setWanderer`, `saveHeroToLeaderboard` -> `saveWandererToLeaderboard` in store
- Rename hero* CSS classes/test IDs in RunEndView to wanderer*
- Rename character step/IDs in IntroView to wanderer
- Update all referencing tests

## Item 5: Remove Turns Outside Combat

Turns are mechanically combat-only already, but `turnNumber` leaks into UI and data model.

### Changes
- Rename `turnNumber` -> `combatRounds` in types, engine, store, persistence
- Rename `turnsSurvived` -> `combatRounds` in LeaderboardEntry
- Add save migration v4 -> v5
- Update UI text from "Turns" to "Rounds"
- Replace `turnNumber` in tile description seed with position-only seed

## Item 6: Richer World Encounters

The world feels empty. Add a discovery system parallel to the enemy system.

### Discovery types
- **Item find**: Herbs, found weapons, charms
- **Friendly NPC**: Narrative encounters with forest denizens
- **Environmental event**: Healing springs, shrines (XP), traps, hidden caches

### Changes
- Add `discoveryId?: string` to Tile type
- New `src/engine/discoveries.ts` with registry and placement logic (~15-20% per tile)
- Place discoveries during world gen after enemies (no overlap)
- Resolve discoveries on tile entry in store's `movePlayer`
- Add findable items to items.ts (lower-power than heirlooms)
- Increase enemy density from 12% to 18%
- New test file for discoveries

## Execution Order

1. Item 1 (map travel) -- small UI change
2. Item 4 (terminology rename) -- mechanical find-and-replace
3. Item 5 (remove turns) -- types + persistence migration
4. Item 6 (world encounters) -- largest, new engine module
