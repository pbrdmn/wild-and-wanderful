# ADR 0010: Legacy and Progression System

## Status

Accepted

## Context

Phase 5 adds character identity, progression, run completion, and cross-run persistence. The game previously had no way to end a run, no leveling, and no persistent data between playthroughs.

## Decision

### Character Creation
- Players choose a name (default "Wanderer") and one of 7 animal species (Fox, Bear, Mouse, Raccoon, Cat, Bird, Frog).
- Species is cosmetic only; no mechanical differences. This preserves the "classless" design.
- Sprite sheets in `public/character-selection.png` (front view) and `public/characters.png` (back view) provide art for each species using CSS background-position cropping.

### XP and Level-Up
- XP is awarded on combat victory equal to the defeated enemy's `maxHp`.
- Level thresholds: 0, 3, 8, 15, 25 XP for levels 1-5.
- Each level grants increased `maxWounds` and (at levels 3, 5) additional `maxActiveSkills` slots.
- Progression is handled by pure functions in `src/engine/progression.ts`.

### Run Completion
- Reaching the quest marker tile completes the quest (`gamePhase: 'questComplete'`).
- A "Retire" button allows voluntary retirement at any time (`gamePhase: 'retired'`).
- Both paths save the hero to the leaderboard and clear the game save.

### Leaderboard
- Stored in a separate IndexedDB key (`leaderboard`), independent of the game save.
- Capped at 50 entries, sorted by: quest completed > level > XP > date.
- Loaded on app startup and available from the intro screen ("Hall of Heroes").

### Legacy NPCs
- On world generation, up to 3 retired heroes from the leaderboard are placed on village tiles.
- Quest completers are weighted higher for selection.
- Legacy NPCs display flavor text in SceneView; no mechanical effect in Phase 5.

### Save Migration
- Migration v3 -> v4 backfills `player.species = 'fox'` and `player.xp = 0`.

## Consequences

- The leaderboard creates a meta-progression loop across runs.
- Legacy NPCs provide narrative continuity without mechanical complexity.
- The separate IDB key for leaderboard data means it persists even when game saves are cleared.
