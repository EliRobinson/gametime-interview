# Session: single `pnpm dev` for all servers

**Date/time:** 2026-07-28 ~10:20 PT  
**Branch:** `shared-ui-tokens`

## Summary

Made root `pnpm dev` the one-command way to run api + web + mobile-web together, using Turborepo (already in the monorepo — no Docker, no extra CLI).

## Decision

Prefer `turbo run dev --filter=api --filter=web --filter=mobile-web` over adding `concurrently`/`npm-run-all`. Turbo is already a dependency, handles persistent parallel tasks, and needs only Node + pnpm (same as the rest of the repo).

## Changes

- Root `package.json`: `dev` now filters the three apps explicitly (instead of bare `turbo run dev`).
- README “Running it” / “Getting started” updated to lead with `pnpm dev`; per-app scripts remain.
