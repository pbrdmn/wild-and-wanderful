# 0006 - Item and Inventory System

**Status:** Accepted
**Date:** 2026-03-13

## Context

The game needs items and an inventory to support the core design of classless, item-driven progression. Players define their playstyle through equipped items, and future skills will be locked to item categories. The system must integrate with the existing pure-engine architecture and auto-persist via the Zustand save subscriber.

## Decision

- **ItemCategory** uses generic classifications (`melee`, `ranged`, `magic`) rather than specific weapon names, so new item types (daggers, crossbows, staves) slot in without schema changes.
- **Inventory** is embedded in the `Player` type with a fixed `maxSlots` (default 5) and a single `equippedItemId`. This keeps the data flat and serialisable.
- **Full-turn swap**: changing the equipped item during gameplay costs all AP (`AP_COST_SWAP = DEFAULT_MAX_AP`), making equipment changes a meaningful tactical decision. Free equip is available only when nothing is currently equipped.
- **selectItem** is a general-purpose store action for choosing from a set of `offeredItems`. It handles the intro heirloom choice and can be reused for treasure chests or loot drops in future phases.
- **Engine/UI separation** is maintained: all inventory mutations are pure functions in `src/engine/inventory.ts`, and the store wraps them with messages and phase transitions.

## Consequences

- The single-equipped-item model is simple but will need revisiting if the design expands to multiple equipment slots (e.g. armour, accessories).
- `offeredItems` is persisted in `SaveData` so a player who closes the app mid-selection can resume. The field is optional for backward compatibility with older saves.
- Item IDs use a module-level counter (`heirloom-1`, `heirloom-2`, ...). This is sufficient while items are only created during world init, but will need a more robust ID strategy if items are created dynamically (e.g. loot drops mid-session across multiple events).
- The item-locked skill system (Phase 4) can key off `ItemCategory` to determine which skills are active based on the equipped item.
