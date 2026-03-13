# Phase 8: UI Improvements -- Visual Battle Stage

## Goal

Transform the text-heavy SceneView into an immersive visual experience inspired by classic Pokemon battles. The player's wanderer (back-facing) is always visible looking at the scene. During combat, the enemy appears opposite. Terrain-specific backgrounds set the mood. All art uses placeholder visuals designed for easy PNG replacement later.

## Changes

### New Modules

- `src/sprites/spriteConfig.ts` -- Shared sprite sheet configuration and style helpers (`getBackSpriteStyle`, `getFrontSpriteStyle`, `SPECIES_LABELS`), eliminating duplication across IntroView, RunEndView, and LeaderboardView.
- `src/sprites/terrainBackgrounds.ts` -- Maps each of the 9 terrain types to a CSS gradient background and ground color placeholder.
- `src/sprites/enemySprites.ts` -- Maps each of the 8 enemy IDs to a placeholder colored silhouette and emoji symbol.

### New Component

- `src/components/BattleStage/` -- A visual stage rendered at the top of SceneView showing:
  - Terrain-specific gradient background
  - Player back-sprite (bottom-left, from existing `characters.png`)
  - Enemy sprite placeholder (top-right) during combat, with name and HP bar overlay
  - Legacy NPC front-sprite (top-right) when on an NPC tile during exploration
  - Ground platform with shadow ellipses

### Modified Components

- `SceneView` -- BattleStage added above text content; enemy info/HP bar removed from combat panel (now in BattleStage); combat panel retains combat log and action buttons.
- `IntroView` -- Uses shared `getFrontSpriteStyle` instead of local sprite config.
- `RunEndView` -- Uses shared `getBackSpriteStyle` and `SPECIES_LABELS`.
- `LeaderboardView` -- Uses shared `getBackSpriteStyle` and `SPECIES_LABELS`.

## Drop-in Asset Guide

When real pixel art assets are ready:

1. **Enemy sprites**: Place `{enemyId}.png` files in `public/enemies/`. Update `enemySprites.ts` to reference them.
2. **Terrain backgrounds**: Place `{terrain}.png` files in `public/backgrounds/`. Update `terrainBackgrounds.ts` to reference them.
3. **NPC sprites**: Already handled via the existing `character-selection.png` sheet.
