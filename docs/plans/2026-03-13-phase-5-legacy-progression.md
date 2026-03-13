# Phase 5: Legacy and Progression

## Current State

- `Player.name` is hardcoded to `"Wanderer"` and `Player.level` is always `1` -- no character creation or leveling
- The quest marker is placed at world generation but reaching it has no effect
- There is no way to "end" a run -- no completion, no retirement
- No persistent data across runs (leaderboard, legacy NPCs)
- Save version is 3; migration pipeline in `src/utils/persistence.ts` supports sequential upgrades

## Architecture Approach

Same pattern as prior phases (ADR 0003):

1. Pure engine modules first (`src/engine/progression.ts`, `src/engine/leaderboard.ts`, `src/engine/legacy.ts`)
2. Zustand store actions second (`src/stores/gameStore.ts`)
3. React UI last (expand IntroView, add RunEndView, LeaderboardView)

Save data migration from v3 to v4 via the versioned pipeline (ADR 0008).

## Data Model Changes

### New types in `src/engine/types.ts`

```typescript
export const AnimalSpecies = {
  Fox: 'fox',
  Bear: 'bear',
  Mouse: 'mouse',
  Raccoon: 'raccoon',
  Cat: 'cat',
  Bird: 'bird',
  Frog: 'frog',
} as const
export type AnimalSpecies = (typeof AnimalSpecies)[keyof typeof AnimalSpecies]

export interface LeaderboardEntry {
  id: string
  name: string
  species: AnimalSpecies
  level: number
  xp: number
  turnsSurvived: number
  questCompleted: boolean
  equippedItemName: string | null
  date: number
}

export interface LegacyNpc {
  name: string
  species: AnimalSpecies
  level: number
  questCompleted: boolean
  tileX: number
  tileY: number
}
```

### Extended existing types

- **Player**: add `species: AnimalSpecies`, `xp: number`
- **Tile**: add optional `legacyNpc?: LegacyNpc`
- **GamePhase**: extend to `'intro' | 'exploring' | 'combat' | 'resting' | 'questComplete' | 'retired'`
- **Constants**: `XP_LEVEL_THRESHOLDS = [0, 3, 8, 15, 25]` (levels 1-5), `MAX_LEADERBOARD_ENTRIES = 50`

### Level-up rewards

| Level | maxWounds | maxActiveSkills |
|-------|-----------|-----------------|
| 1     | 1         | 2               |
| 2     | 2         | 2               |
| 3     | 3         | 3               |
| 4     | 4         | 3               |
| 5     | 5         | 4               |

XP source: combat victory awards `enemy.maxHp` XP.

### Save migration (v3 to v4)

- Backfill `player.species: 'fox'`
- Backfill `player.xp: 0`
- Bump `CURRENT_SAVE_VERSION` to 4

### Leaderboard persistence

Separate IndexedDB key (`leaderboard`) from game save. Capped at 50 entries. Loaded on app startup.

### Sprite sheets

- `public/character-selection.png` -- front-facing sprites (7 species). Grid: top row (Fox, Bear, Mouse), bottom row (Raccoon, Cat, Bird, Frog).
- `public/characters.png` -- back-facing sprites. Same grid layout.

## Task Breakdown

### 5a. Character creation types and engine
### 5b. Character creation UI (IntroView expansion)
### 5c. Progression engine (XP and level-up)
### 5d. Store integration (XP gain, level-up, quest completion, retirement)
### 5e. Quest completion and retirement narrative (RunEndView)
### 5f. Leaderboard engine and persistence
### 5g. Leaderboard UI
### 5h. Legacy NPC system
### 5i. Save migration and ADR

## New Files

- `src/engine/progression.ts`
- `src/engine/leaderboard.ts`
- `src/engine/legacy.ts`
- `src/components/RunEndView/RunEndView.tsx` + CSS module
- `src/components/LeaderboardView/LeaderboardView.tsx` + CSS module
- `tests/engine/progression.test.ts`
- `tests/engine/leaderboard.test.ts`
- `docs/adr/0010-legacy-progression.md`

## Key Files Modified

- `src/engine/types.ts`
- `src/stores/gameStore.ts`
- `src/utils/persistence.ts`
- `src/engine/world.ts`
- `src/components/IntroView/IntroView.tsx`
- `src/components/SceneView/SceneView.tsx`
- `src/App.tsx`
