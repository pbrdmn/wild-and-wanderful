# 0004 - Git Workflow

**Status:** Accepted
**Date:** 2026-03-13

## Context
The project is built incrementally across multiple phases. We need a git workflow that keeps the history clean, reviewable, and easy to bisect if issues arise.

## Decision
- One **feature branch per phase** (e.g. `feat/phase-1-scaffolding-scene-movement`)
- One **commit per task** within each phase, with descriptive conventional commit messages
- Branches are merged to `main` before starting the next phase
- ADRs are committed alongside the code they document

## Consequences
- Clean, linear history that maps directly to the build plan
- Easy to review each phase as a cohesive unit
- Bisecting bugs is straightforward since each commit is a self-contained, testable increment
- Requires discipline to keep commits atomic and well-scoped
