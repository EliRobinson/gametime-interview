# Session: fix stale mobile-web e2e

**Date:** 2026-07-29 12:07

## Summary

CI `pnpm test:e2e:web` failed because Playwright still asserted the template counter (`Count: 0` / `increment-button`). Home is now listing selection. Updated the e2e to cover selection → checkout, and started the API from Playwright so listings load in CI without a checked-in `.env`.

## Root cause

- `apps/mobile-web/e2e/web/home.spec.ts` was leftover from the initial RN-web template.
- Playwright only booted Expo web; listings need the API on `:4000`.

## Changes

1. **`home.spec.ts`** — assert `home-selection` / `selection-screen`, Ed Sheeran header, select `listing_1`, Continue → `/checkout/…`.
2. **`playwright.config.ts`** — dual `webServer`: API via `tsx src/index.ts` with `DATABASE_URL`/`PORT` env (no `--env-file`), plus `pnpm dev:web`.

## Verification

`pnpm --filter mobile-web test:e2e` — 1 passed locally.
