# 0001 - Tech Stack

**Status:** Accepted
**Date:** 2026-03-13

## Context
We need a tech stack for a mobile-first, offline-first PWA single-player RPG. The stack must support fast iteration, strong typing for complex game state, and work well offline.

## Decision
- **React 19 + TypeScript** for the UI layer with strong type safety across game state
- **Vite** as the build tool for fast HMR and modern ESM-first tooling
- **CSS Modules** with CSS custom properties for scoped, themeable styling without runtime cost
- **Zustand** for lightweight game state management (simpler than Redux, less boilerplate)
- **idb-keyval** for IndexedDB persistence (simple key-value API over IndexedDB for save/load)
- **Vitest + React Testing Library** for unit and integration testing

## Consequences
- Zustand's minimal API means less boilerplate but requires discipline to structure game state well
- CSS Modules avoid runtime styling cost but mean no dynamic style composition (acceptable for a game with a fixed palette)
- idb-keyval is simple but limited to key-value patterns; complex queries would require upgrading to Dexie or raw IndexedDB
