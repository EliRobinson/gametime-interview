# Session — Mobile inline selection + Expo cold-start notes

**Date:** 2026-07-29 11:35  
**Slug:** `mobile-inline-selection`

## Summary

Diagnosed Expo `simctl openurl` timeout on fresh simulator boot (not an app bug). Redesigned mobile ticket selection from sticky dock to **inline expand** so the map stays visible and the listing list keeps usable scroll height.

## Expo cold start

- Error: `xcrun simctl openurl … code: 60` / Operation timed out while Metro still bundled successfully.
- Cause: Expo races SpringBoard on cold boot; no built-in “wait until safe” flag.
- Fix pattern: gate with `xcrun simctl bootstatus booted -b` before opening the deep link (wrapper around `dev:ios`), not “always pre-boot the sim.”

## Mobile selection

**Problem:** Stacked layout = fixed map + scroll cards + sticky `ListingDetail` dock. On iPhone SE the dock ate the list; cards looked cut off and scrolling felt tiny.

**Decision (approved):** Approach A — inline expand; **do not collapse the map** (seat orientation).

| Layout             | Behavior                                                                 |
| ------------------ | ------------------------------------------------------------------------ |
| `stacked` (mobile) | No dock; selected `ListingCard` expands with fee line, notices, Continue |
| `sidebar` (web)    | Unchanged sticky dock                                                    |

## Files

- `docs/superpowers/specs/2026-07-29-mobile-inline-selection-design.md`
- `packages/ui/src/features/listings/ListingCard.tsx` — optional `inlineContinue`
- `packages/ui/src/features/listings/SelectionScreen.tsx` — stacked drops dock
- `packages/ui/src/features/listings/SelectionScreen.test.tsx` — sidebar + stacked coverage

## Verification

`SelectionScreen` unit tests: 7 passed.
