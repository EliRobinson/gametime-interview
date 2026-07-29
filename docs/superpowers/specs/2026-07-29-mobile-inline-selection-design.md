# Mobile inline selection — design

**Date:** 2026-07-29  
**Status:** approved

## Problem

Stacked (mobile) selection uses a sticky `ListingDetail` dock under a fixed map. On short phones the dock + map leave almost no list height, so cards clip and scrolling feels unusable.

## Decision

**Inline expand on stacked layout; map stays fixed.** Web sidebar + dock unchanged.

| Zone         | Behavior                                                   |
| ------------ | ---------------------------------------------------------- |
| Event header | Compact, always mounted                                    |
| Map          | Fixed height (~220px), always visible for seat orientation |
| Listing list | Full remaining height; primary scroll surface              |
| Sticky dock  | **Removed** on `layout="stacked"`                          |

### Selection

- Compact card: section/row, price, seats, optional SUPER DEAL badge
- Selected card expands **in place** with fee line, optional super-deal notice, create-error, Continue
- Map highlight stays synced via `selectedListingId`

## Out of scope

- Collapsing map
- Bottom-sheet / drag gestures
- Expo simulator boot gate (separate concern)
