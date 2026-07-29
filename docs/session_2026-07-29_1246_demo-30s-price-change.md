# Session — Demo 30s timed price change

**Date:** 2026-07-29 12:46  
**Slug:** `demo-30s-price-change`

## Summary

Made one catalog listing demo-able for the price-reconfirmation path without
manual `setPrice` / REPL poking. Reviewers pick a labeled ticket, wait 30s on
checkout, and see the price-change UI.

## Decisions

- **Which listing:** `listing_3`, selection label `Sec 118 · 30s price demo`.
- **Where the bump lives:** `FakeInventoryProvider` — after hold start + 30s,
  `getHoldStatus` returns `$109.00`. `listListings` and fresh `placeHold` always
  use the seeded `$89.00`, so leaving checkout and browsing again looks normal.
- **How the fan sees it without tapping Buy:** web + mobile schedule from
  `session.createdAt` via `msUntilDemoPriceBump` (`@repo/api-contracts`) and
  flip into `price_changed` with `newPriceCents`. Server truth still enforces
  the mismatch on `complete` / `confirmPrice`.
- **Constants:** `DEMO_PRICE_CHANGE` in `packages/api-contracts` so API + clients
  share listing id, delay, and bumped cents.

## Why

Prompt asks for at least two fan-visible state changes. Price change was covered
in tests but not obviously clickable in a live demo. One self-healing demo
ticket is enough; other failures stay on deterministic fakes.

## Key files

- `packages/api-contracts/src/demo-price-change.ts`
- `apps/api/src/domain/inventory-provider.ts`
- `apps/web` / `apps/mobile-web` checkout clients (timer)
- `packages/ui/.../listings.fixtures.ts` (label)
- `README.md` (how to try it)
