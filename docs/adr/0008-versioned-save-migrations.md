# 0008 - Versioned Sequential Save Migrations

**Status:** Accepted
**Date:** 2026-03-13
**Supersedes:** ADR 0007

## Context

ADR 0007 established inline migration guards in `loadSavedGame()` for handling schema changes to persisted save data. While adequate for a single migration, inline guards become scattered and hard to reason about as the schema evolves across phases. A more structured approach is needed before the number of migrations grows.

## Decision

- **Version-stamped saves**: every save written to IndexedDB includes a `saveVersion` number. Saves missing this field are treated as version 1 (pre-Phase-3).
- **Sequential migration pipeline**: a `migrations` record in `src/utils/persistence.ts` maps each version number to a transform function that migrates data from version N to N+1. On load, `migrateSaveData()` runs all migrations in order from the save's version up to `CURRENT_SAVE_VERSION`.
- **Forward-only**: there are no backward (downgrade) migrations. If a save's version is newer than the running app's `CURRENT_SAVE_VERSION`, `loadGame()` returns `null` and the app starts a new game. This is acceptable for a single-user offline game with no rollback path.
- **Migration ownership**: when a phase adds or changes persisted fields, the developer adds a new entry to the `migrations` record and bumps `CURRENT_SAVE_VERSION`. This replaces the inline-guard convention from ADR 0007.
- **Store simplification**: `loadSavedGame()` in the Zustand store trusts that `loadGame()` returns fully-migrated data and contains no migration logic itself.

## Consequences

- All migration logic is centralised in one file (`persistence.ts`), making it easy to audit the full history of schema changes.
- Each migration is independently testable as a pure function.
- Adding a migration is a two-step process: write the transform function and increment the version constant. Forgetting either step will cause test failures (old saves won't load correctly).
- The `migrations` record grows by one entry per schema change, which is manageable for the expected lifespan of the project (6 phases).
- Future-version saves are silently discarded. If this becomes a problem (e.g. shared devices with multiple app versions), a user-facing warning could be added.
