# Session: Ticket landing + Share tickets

**Date/time:** 2026-07-28 ~16:30 PT  
**Branch:** `feat/ticket-landing-share`  
**Slug:** ticket-landing-share

## Summary

Implemented `docs/2026-07-28-ticket-landing-design.md`: selection landing on web + mobile-web,
`listings.list` + hold exclusivity in the fake inventory, shared `@repo/ui` listings feature,
and **Share tickets** on checkout (web URL + `mobileweb://` deep link).

## Key decisions / tradeoffs

- Cleared merged local `shared-ui-tokens`; branched from updated `main`.
- Catalog is hybrid: presentation fixtures keyed by `listingId`; API owns price + `available`.
- `placeHold` rejects already-held listings (`ListingAlreadyHeldError` → `ListingUnavailableError` / `UNPROCESSABLE_CONTENT`).
- Share visibility driven by apps via `isShareableSession` + optional `CheckoutCard` share props (hidden for completed / expired / pending_payment).
- Static map schematic + price bubbles (not an interactive map engine).
- Web share default origin `http://localhost:3001` (`NEXT_PUBLIC_WEB_ORIGIN` / `EXPO_PUBLIC_WEB_ORIGIN`).

## What shipped

- API: multi-seed inventory, `listings.list`, exclusivity tests
- `@repo/ui` `features/listings/*` + checkout share util/UI
- `apps/web` `/` SelectionLanding; checkout share copy
- `apps/mobile-web` home SelectionScreen; checkout `Share.share`
