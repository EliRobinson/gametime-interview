# Design: Ticket landing + cross-surface share

**Date:** 2026-07-28  
**Status:** Ready for review  
**Apps:** `apps/web`, `apps/mobile-web`  
**Related:** `CONTEXT.md`, `docs/decisions.md`, existing checkout continuity work

## Goal

Give both apps a landing experience where a fan can view fake event listings, select one, start checkout (placing the real inventory hold), and **share** a resume link so the same purchase can continue — in the same browser window, another browser tab/window, or the mobile app.

## Decisions locked in

| Topic                 | Choice                                                                                                 |
| --------------------- | ------------------------------------------------------------------------------------------------------ |
| Selection UI fidelity | Static stadium map backdrop + listing cards (not a full interactive map engine)                        |
| After Continue        | Create session → navigate this surface to `/checkout/[id]`                                             |
| Catalog               | Hybrid: shared presentation fixtures keyed by `listingId`; API owns price + availability/hold          |
| Shared UI             | New feature module in `@repo/ui` (same pattern as `features/checkout`)                                 |
| Cross-surface         | **Share tickets** control that exposes a resume link — not a “open the other app on this device” strip |

## Resume / takeover rules

Possession of the session id is the credential (unchanged). Opening the shared link must always land on checkout for that session and call the existing `checkout.resume` path so the new surface becomes a live view onto the same server-owned session.

| Where the link opens          | Expected behavior                                                                                                   |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Same browser window/tab       | Fan can continue checkout for that session (navigate/reload to `/checkout/<id>` is enough)                          |
| Another browser tab or window | Fan can **take over** and complete checkout there (same web URL; resume records `surface: 'web'`)                   |
| Mobile app (deep link)        | Fan can **take over** and complete checkout there (`mobileweb://checkout/<id>`; resume records `surface: 'mobile'`) |

“Take over” means resume the same session — not transferring exclusive ownership in the domain model. Two surfaces may both view a resumable session; duplicate **completion** is still prevented by the existing CAS on `pending_payment` (`ConflictError` / “Finishing on another device”).

Share is only offered while the session is still resumable (e.g. `created`, `active`, or `failed` with retry). Hide it for `completed`, `expired`, and while `pending_payment` (already claimed for completion).

## Architecture

```
┌─────────────────────┐     ┌─────────────────────┐
│  apps/web `/`       │     │  apps/mobile-web `/`│
│  SelectionScreen    │     │  SelectionScreen    │
└─────────┬───────────┘     └─────────┬───────────┘
          │  listings.list            │
          │  checkout.create          │
          ▼                           ▼
┌─────────────────────────────────────────────────┐
│  @repo/ui features/listings                     │
│  map + cards + detail + Continue                 │
│  fixtures (event / section / Super Deal / …)    │
└─────────────────────────────────────────────────┘
          │
          ▼  navigate `/checkout/[id]`
┌─────────────────────────────────────────────────┐
│  Existing checkout + Share tickets              │
│  web URL + mobile deep link from session id     │
└─────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────┐
│  apps/api                                       │
│  FakeInventoryProvider seeds + listings.list    │
│  CheckoutService (unchanged state machine)      │
└─────────────────────────────────────────────────┘
```

## Screens & flow

### Landing (both apps)

- One demo event shaped like the Gametime selection mocks (Ed Sheeran · Lumen Field).
- Static map image with a small set of price bubbles; tapping a bubble selects the matching listing.
- Listing cards (section, row, quantity, Super Deal, live price from API).
- Detail panel (web sidebar / mobile stacked detail): urgency + Super Deal copy, primary **Continue**.
- Unavailable listings (`available: false`) are dimmed and not selectable.

### Continue

1. `checkout.create({ listingId })` — places inventory hold (purchase lock).
2. Navigate to `/checkout/[id]` on the current surface.
3. Existing checkout UI (complete, confirm price, expired, conflict, etc.).

### Share tickets

On checkout for a resumable session, a **Share tickets** control (copy key in checkout `.copy`; label is exactly “Share tickets” unless accessibility needs a longer accessible name).

Behavior:

- Build resume targets from the session id:
  - **Web:** `{webOrigin}/checkout/{sessionId}` (configurable origin; local default `http://localhost:3001`)
  - **Mobile:** `mobileweb://checkout/{sessionId}`
- Share / copy uses the **web URL as the primary link** (same window, another tab/window, or any browser). Also expose the mobile deep link (secondary copy action or included in the share body) so the native app can open the same session.
- Opening either link runs the existing resume path on that surface; the fan can finish purchase there.

Out of scope for this pass: interactive map engine, full payment-method chrome from the checkout mock, multi-event catalog, Playwright cross-device E2E.

## API & data

### Inventory

Expand `FakeInventoryProvider` seeds to several listings with distinct prices. `placeHold` via `checkout.create` remains the only purchase lock.

**Hold exclusivity:** If a listing is already held, `placeHold` must reject (surface as listing unavailable / create failure). Today’s fake can re-hold an already-held id; tighten that as part of this work so `listings.list`’s `available: false` and `checkout.create` stay consistent.

### `listings.list` (new tRPC query)

Wire schema in `@repo/api-contracts`. Approximate shape:

```ts
{
  listings: Array<{
    listingId: string;
    priceCents: number;
    available: boolean; // false when currently held
  }>;
}
```

No event/marketing fields on the wire. Unknown or unseeded ids are omitted.

### Presentation fixtures

`listings.fixtures.ts` in the listings feature, keyed by `listingId`:

- Event: artist, venue, datetime, map/hero asset refs
- Listing: section, row, seat count, Super Deal flag, bubble position on the static map, optional seat-view asset

Apps merge: `fixture ⊕ API row → selection view-model`.

## Shared UI module

`packages/ui/src/features/listings/`, following AGENTS.md naming:

| File                                                                                                        | Role                                                   |
| ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `ListingsMap.tsx` / `ListingCard.tsx` / `ListingDetail.tsx` / `SelectionScreen.tsx` (PascalCase components) | UI                                                     |
| `listings.copy.ts`                                                                                          | User-facing strings                                    |
| `listings.view-model.ts`                                                                                    | UI state types                                         |
| `mapListingsView.util.ts`                                                                                   | Merge fixtures + API → view model                      |
| `listings.fixtures.ts`                                                                                      | Event + listing presentation data keyed by `listingId` |
| `*.test.ts(x)`                                                                                              | Beside the file under test                             |

Theme: light for web, dark for mobile (same `ThemeProvider` pattern as `CheckoutCard`).

**Share tickets** lives on checkout: optional props on `CheckoutCard` (`shareWebUrl`, `shareMobileUrl`, `onShare`) so visibility and copy stay shared; apps supply the URLs and perform clipboard / `Share.share`.

## Errors & edge cases

| Case                           | Behavior                                                   |
| ------------------------------ | ---------------------------------------------------------- |
| `listings.list` fails          | Error + retry on landing; Continue disabled                |
| Listing unavailable / held     | Dimmed; cannot Continue                                    |
| `checkout.create` fails        | Inline error on detail panel; stay on landing              |
| Share on non-resumable session | Control hidden                                             |
| Two creates for same listing   | First hold wins; second sees unavailable or create failure |
| Two completes for same session | Existing CAS / `CONFLICT`                                  |

## Testing

- **API:** `listings.list` returns seeded prices; held listing → `available: false`.
- **Shared UI:** merge util; Continue disabled when unavailable; Share visibility by session status.
- **Apps:** home renders listings; Continue creates + navigates; Share exposes expected web URL and mobile deep-link shapes.
- Cross-device Playwright E2E remains deferred (`docs/decisions.md`).

## Non-goals

- Replacing or redesigning the checkout state machine
- Real inventory/payment providers
- Auth on share links (session id remains the capability)
- Pixel-perfect stadium map interaction

## Success criteria

1. Both apps open on a selection landing page (not the template stub / missing `/`).
2. Selecting a listing and continuing creates a real checkout session with an inventory hold.
3. Fan can complete purchase on the surface they continued on.
4. **Share tickets** yields a link that works in the same window, another web tab/window, and via mobile deep link — each can resume and complete (subject to existing conflict rules).
5. Visual language matches the selection mocks at the “static map + cards + Super Deal” level, using existing Gametime tokens.
