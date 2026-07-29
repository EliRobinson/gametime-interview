# Session — Mobile list price truncation + 10s poll

**Date:** 2026-07-29 13:34  
**Slug:** `mobile-list-price-poll`

## Summary

Fixed mobile listing cards clipping the price next to the long
`118 · 15s price demo` section label, and added a 10s listings poll so the
list view picks up server-side availability changes while the fan browses.

## Decisions

- **Layout fix:** Keep the demo section label as-is (reviewers still spot the
  timed ticket). Bound the title with `flex: 1` / `minWidth: 0` and
  `flexShrink: 0` on the price so long labels wrap instead of shoving `$89.00`
  off the card edge.
- **Polling:** Mobile uses React Query `refetchInterval: 10_000` on
  `listings.list`. Web selection landing gets the same cadence via
  `setInterval`, with background refreshes that do not flash the loading
  spinner or wipe the list on transient failures.

## Why

The demo fixture stuffed a long string into `section`, and the card row gave
both title and price unconstrained width. Price lost. Separately, list status
was only refreshed on initial load / create failure, so held/unavailable flips
from other sessions stayed invisible until a manual retry.

## Key files

- `packages/ui/.../ListingCard.tsx` (+ test)
- `apps/mobile-web/app/index.tsx` (+ test)
- `apps/web/app/selection-landing.tsx` (+ test)
