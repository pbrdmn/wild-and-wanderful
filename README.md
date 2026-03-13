# Wild and Wanderful: A Cosy Adventure

A mobile-first, offline-first turn-based RPG built as a Progressive Web App. Explore a randomly generated world of forests, meadows, rivers, and villages as a cute animal protagonist on a quest to save the world -- or just wander and enjoy the scenery.

Inspired by the warmth of Studio Ghibli and the charm of classic fantasy like *The Hobbit*, Wild and Wanderful combines tactical roguelike depth with a cosy, approachable aesthetic.

## Features

- **Procedural world generation** -- a 20x20 grid of diverse biomes with seeded randomness
- **Atmospheric text descriptions** -- rich prose for every terrain type with directional glimpses
- **Turn-based exploration** -- manage Action Points to move, search, and rest
- **Fog of war map** -- explore and uncover the world tile by tile
- **Offline-first** -- works entirely without an internet connection after first load
- **Mobile-first** -- designed for portrait, one-handed play

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI | React 19, TypeScript |
| Build | Vite |
| Styling | CSS Modules, CSS custom properties |
| State | Zustand |
| Persistence | IndexedDB (idb-keyval) |
| PWA | vite-plugin-pwa (Workbox) |
| Testing | Vitest, React Testing Library |

## Getting Started

### Prerequisites

- Node.js >= 20
- npm >= 10

### Install

```bash
git clone <repo-url>
cd wild-and-wanderful
npm install
```

### Development

Start the dev server with hot module replacement:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`. Open it in a mobile browser or use your browser's device emulation for the intended portrait experience.

### Testing

Run all tests:

```bash
npm test
```

Run tests in watch mode during development:

```bash
npm run test:watch
```

### Linting

```bash
npm run lint
```

### Production Build

```bash
npm run build
```

The built output lands in `dist/`. This includes the PWA service worker and manifest for offline support.

### Preview Production Build

```bash
npm run preview
```

Serves the production build locally for testing.

## Project Structure

```
src/
  engine/        Pure TypeScript game logic (no React dependencies)
    types.ts     Game type definitions
    world.ts     World generation
    biomes.ts    Biome descriptions and text
    movement.ts  Movement rules and AP cost
    random.ts    Seeded PRNG
  stores/
    gameStore.ts Zustand store bridging engine to UI
  components/
    SceneView/   Main text-based scene display
    MapView/     Grid map for navigation
  styles/
    theme.css    CSS custom properties (colour palette, fonts)
tests/
  engine/        Unit tests for game logic
  components/    Component integration tests
  stores/        Store tests
docs/
  adr/           Architecture Decision Records
  plans/         Build plans (date-prefixed)
```

## Architecture

Game logic is fully separated from the UI layer. All rules, world generation, and state transitions live in `src/engine/` as pure TypeScript functions. React components are thin rendering layers that read from Zustand and dispatch actions. See [ADR 0003](docs/adr/0003-game-engine-separation.md) for details.

## License

All rights reserved.
