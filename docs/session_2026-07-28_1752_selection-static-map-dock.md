# Session — Selection layout: static map + sticky dock

**Date:** 2026-07-28 17:52  
**Slug:** `selection-static-map-dock`

## Summary

Fixed the ticket selection split pane so the stadium map no longer resizes with left-column content, and replaced the expanding top detail panel (which shoved the listing list down on select) with a modern sticky selection dock.

## Problem

1. **Map resize** — The sidebar layout grew with left content height; the map (`flex: 1`) stretched with it, so the stadium schematic changed size when ticket details appeared.
2. **Content jump** — `ListingDetail` lived above the listing cards and swapped a compact empty state for a tall selected panel (badges, urgency, super-deal notice), pushing the entire list down.

## Decisions

### Viewport-locked split

- Web `main` uses fixed `height: calc(100vh - 56px)` + `overflow: hidden` (not just `minHeight`) so the selection screen can fill a known viewport.
- Sidebar root is a row flex container with `alignItems: 'stretch'`, `minHeight: 0`, `overflow: 'hidden'`.
- Left column: fixed width, independent `ScrollView` for cards, sticky dock at bottom — column height stays viewport-bound.
- Right column / `ListingsMap`: fills remaining space with `position: 'relative'` so price bubbles anchor to the map, not the viewport.

### Explicit `display: 'flex'`

React Native Web’s default View stylesheet (`css-view-*` → `display: flex`) was not applying in the web app; computed `display` was `block`, so `flexDirection: 'row'` had no effect and the map collapsed. Set `display: 'flex'` explicitly on the selection layout Views.

### Sticky selection dock (vs expanding top panel)

Modern pattern:

| Zone                          | Role                                                  |
| ----------------------------- | ----------------------------------------------------- |
| `SelectionEventHeader`        | Compact, always-mounted event chrome                  |
| Scrollable `ListingCard` list | Selection only changes card border — cards don’t jump |
| `ListingDetail` dock          | Pinned bottom CTA + selection summary                 |

Optional banners (urgency / super deal) live in the dock. Dock height can grow slightly, but that only shrinks the scroll area — it no longer inserts a growing block above the list.

Stacked (mobile) layout uses the same header + fixed-height map + scroll cards + dock structure.

## Files touched

- `packages/ui/src/features/listings/SelectionScreen.tsx`
- `packages/ui/src/features/listings/ListingDetail.tsx` (+ `SelectionEventHeader`)
- `packages/ui/src/features/listings/ListingsMap.tsx`
- `packages/ui/src/features/listings/SelectionScreen.test.tsx`
- `packages/ui/src/features/listings/index.ts`
- `apps/web/app/selection-landing.tsx`

## Verification

- Unit tests for `SelectionScreen` pass.
- Browser measure before/after selecting a listing: `mapHeightDelta: 0`, `leftHeightDelta: 0`, map at right of row (`x ≈ 392`), dock visible.
