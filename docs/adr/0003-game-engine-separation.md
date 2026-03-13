# 0003 - Game Engine Separation from UI

**Status:** Accepted
**Date:** 2026-03-13

## Context
The game has complex logic (world generation, movement rules, combat, AP economy, wound system). Mixing this with React component code would make it hard to test and reason about.

## Decision
- All game logic lives in `src/engine/` as pure TypeScript modules with no React dependencies
- Engine functions are pure: they take state in, return new state out
- React components are thin rendering layers that read from Zustand and call engine functions via store actions
- The Zustand store acts as the bridge between engine logic and React UI

## Consequences
- Game logic is fully unit-testable without React, jsdom, or any UI framework
- Engine modules can be reused if the UI framework changes
- Slightly more indirection: UI -> store action -> engine function -> new state
- Clear separation makes it easier for multiple contributors to work in parallel
