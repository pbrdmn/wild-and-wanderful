# 0007 - Save Data Migration on Schema Changes

**Status:** Superseded (by ADR 0008)
**Date:** 2026-03-13

## Context

The game persists state to IndexedDB as a single serialised object (see ADR 0005). As the data model evolves across phases — new fields on `Player`, new top-level state like `offeredItems`, structural changes to `World` — old saves become incompatible with the new code. Phase 3 introduced this problem when `Player` gained an `inventory` field; loading a Phase 2 save caused a runtime crash because `player.inventory` was `undefined`.

## Decision

- **Every change to `SaveData` or its nested types must include a corresponding migration** in `loadSavedGame()` that backfills missing fields with sensible defaults. This applies to adding fields, renaming fields, or changing field shapes.
- Migrations are **inline guards** in the `loadSavedGame` function rather than a separate migration framework. Each guard checks for the absence of a field and patches the loaded data before it enters the store.
- **New fields on `SaveData` should be marked optional** (`field?: Type`) so TypeScript does not assume they exist on older saves.
- When a migration is added, a **brief comment** should note which phase introduced it and what it backfills, so future contributors can trace the history.
- The existing single-key storage model (ADR 0005) is retained; we do not introduce a schema version number at this time since inline guards are sufficient for the current complexity.

## Consequences

- Developers must remember to add a migration whenever they change persisted types. This is a manual discipline — there is no compile-time enforcement. Code review should check for this.
- Inline guards accumulate over time. If the number of migrations grows significantly (10+), consider introducing a `saveVersion` field and a sequential migration pipeline instead.
- Optional fields on `SaveData` mean the rest of the codebase must handle `undefined` at the persistence boundary, but the store normalises everything before it reaches components.
- Players with old saves will never lose progress due to schema changes, which is important for an offline-first game where users may not update frequently.
