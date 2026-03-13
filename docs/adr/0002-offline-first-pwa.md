# 0002 - Offline-First PWA Strategy

**Status:** Accepted
**Date:** 2026-03-13

## Context
The game must be 100% playable offline. It is a single-player RPG with no server-side logic. All game state lives on the device.

## Decision
- Use **vite-plugin-pwa** to generate a service worker and web app manifest
- Service worker uses **Workbox** with `autoUpdate` registration to precache the entire app shell
- Manifest configured for `standalone` display and `portrait` orientation
- All game state persisted to **IndexedDB** via idb-keyval, not dependent on network
- No API calls or remote data required for gameplay

## Consequences
- The app works fully offline after first load
- Updates require the user to be online briefly for the service worker to fetch new assets
- No sync conflicts to manage since there is no server state
- Font files (Google Fonts) are loaded on first visit; subsequent visits use cached versions
