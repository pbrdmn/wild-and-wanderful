# 0009 - Skills and Combat System

**Status:** Accepted
**Date:** 2026-03-13

## Context

The game needs a combat resolution system and a skill mechanism that ties into the existing item-based progression. Until Phase 4, combat was only a state (`gamePhase === 'combat'`) with no way to resolve it, and no skill system existed. Items had `attackPower` and `category` fields that were unused.

## Decision

### Skills

- **Item-locked skills**: each skill requires a specific `ItemCategory` (melee, ranged, magic) to be equipped. This reinforces the classless, item-driven progression model.
- **Active skill slots**: players unlock skills but may only have `maxActiveSkills` (default 2) active at once. This creates meaningful build decisions without a traditional class system.
- **Skill registry**: all skills are defined in a central `SKILL_REGISTRY` (9 skills, 3 per item category) covering offensive, defensive, and utility archetypes.
- **Skill effects** are a discriminated union (`damage`, `damage_status`, `status`, `dodge_next`) to keep the combat engine's pattern matching simple and extensible.

### Combat

- **Turn-based**: after each player action (attack, skill, flee), the enemy takes their turn automatically. This keeps combat snappy for mobile one-handed play.
- **Wound-based damage**: enemy attacks inflict 1 wound per hit. Player attacks deal `attackPower` (basic) or skill `power` (skill) as raw HP damage to the enemy.
- **Status effects**: `daze` (enemy skips turn), `poison` (1 HP/turn to enemy), `shield` (absorbs 1 wound from next enemy attack). Effects tick down each enemy turn.
- **Flee mechanic**: costs 1 AP with a 70% success chance. On failure, the enemy still gets their turn.
- **Defeat handling**: on defeat (wounds >= maxWounds), the player retreats to the starting village with wounds healed. No permadeath — this matches the cosy-roguelike tone.
- **Tile encounters**: enemies are placed during world generation (~12% of passable non-village tiles). Moving onto a tile with an enemy triggers combat and clears the enemy from the tile.

### Enemy System

- **Enemy registry**: 8 enemy templates with biome associations and varying strength/HP. Biome-appropriate enemies create regional flavour.
- **Ambush enemies** in `rest.ts` now reference the shared registry rather than maintaining a separate list.

### Persistence

- Save version bumped from 2 to 3. Migration backfills player skill fields (`unlockedSkillIds`, `activeSkillIds`, `maxActiveSkills`) and ActiveEnemy combat fields (`hp`, `maxHp`, `statusEffects`).

## Consequences

- The dodge and shield mechanics use transient store state (`playerDodgeChance`, `playerHasShield`) that is consumed on the enemy's turn and not persisted. This is simple but means the effect is lost if the player closes the app mid-combat.
- Enemy AI is purely "attack each turn" — future phases could add enemy abilities or behaviour patterns by extending the `EnemyTemplate` type.
- The 9-skill registry is sufficient for Phase 4 but will need expansion as the game grows. The `SKILL_REGISTRY` pattern makes adding new skills straightforward.
- Combat is resolved within `SceneView` rather than a separate view. This keeps the one-thing-at-a-time UX but may need rethinking if combat grows more complex.
