# Design: Checkout visual shell (web + mobile)

**Date:** 2026-07-28  
**Status:** Ready for review  
**Apps:** `apps/web`, `apps/mobile-web`  
**Shared:** `packages/ui` (`features/checkout`), `packages/tokens`  
**References:** `mocks/references/gametime-web-checkout.png`, `mocks/references/gametime-mobile-checkout.png`  
**Related:** `docs/2026-07-28-ticket-landing-design.md`, `docs/2026-07-28-shared-ui-tokens-design.md`

## Goal

Restyle checkout so **web** matches the Gametime web checkout mock and **mobile** matches the Gametime mobile checkout mock — spacing, sizing, and hierarchy via `@repo/tokens` — while keeping the existing checkout continuity behavior (resume, complete, confirm price, share, conflict/expiry states).

## Decisions locked in

| Topic                         | Choice                                                                                                   |
| ----------------------------- | -------------------------------------------------------------------------------------------------------- |
| Payment chrome                | **None** — visual shell only; CTA drives existing complete / confirm-price / retry                       |
| Decorative non-payment chrome | **Keep as static UI** — stadium schematic, promo link, ticket protection card, guarantee                 |
| Architecture                  | **Hybrid** — shared presentation for summary / deal / urgency / etc.; each app owns page chrome          |
| Mobile canvas                 | **Light** — match the mobile mock (`canvasLight` / `surface`), not the current dark `CheckoutCard` theme |
| Implementation approach       | Expand `features/checkout` with shared presentational blocks; slim `CheckoutCard` to state/actions       |
| CTA label                     | Keep continuity copy (`CONTINUE`, confirm, retry) — not “Buy with G Pay”                                 |
| Price semantics               | `acknowledgedPrice` is listing **total**; do not invent unit × qty = double total                        |

## Non-goals

- Real payment methods (card, Google Pay, Affirm, PayPal, Apple Pay)
- Real promo codes, ticket protection purchase, or auth-backed contact email
- Checkout domain / API / state-machine changes
- Pixel-perfect Playwright visual regression
- Interactive stadium map engine (static schematic only, same spirit as listings map)

## Layout & information architecture

### Web (`apps/web` owns chrome)

- Black top bar: GAMETIME mark + centered “Checkout” + shield (decorative).
- Two-column grid on `canvasLight`; ~60% left / ~40% right; all spacing/radius/color from tokens (CSS vars in SSR shell).
- **Left column:** Contact row (static demo email) → terms → primary CTA region (`CheckoutCard` states) → Share tickets when shareable → Gametime Guarantee panel (static).
- **Right column:** Order summary card — stadium schematic (listings-style static map, highlight selected section bubble), venue/event/datetime, seat + delivery lines from fixtures, urgency strip, tickets line + decorative “Add Promo Code”, total from session, Super Deal when fixture says so.
- Failure SSR path (resume error before client): keep existing full-width failure panel; no need for fake payment chrome.

### Mobile (`apps/mobile-web` owns chrome)

- Light theme throughout.
- Header: back + “Checkout” + shield.
- Stack: event thumbnail / summary row → price total + “Show details” (expands/collapses the shared price breakdown inline; no navigation) → Ticket Delivery row (static email) → Super Deal banner (same copy family as listings; mock’s “Amazing Deal” wording is not required) → static Ticket Protection card → sticky footer (urgency bar + terms + CTA).
- No Payment row.
- Share near CTA / above sticky footer when shareable.
- On `ready`, drop the old “Resumed checkout / Finish your checkout” hero; Gametime page chrome + CTA replace it. Keep those strings only if a compact status needs them (prefer not).

### Shared (`@repo/ui` `features/checkout/`)

Presentation-only building blocks composed by both apps:

- Event / seat summary
- Price breakdown (tickets line + total)
- Super Deal banner
- Urgency banner
- Guarantee panel
- Ticket protection card (static)
- Presentation mapper: session + listing fixtures → view model
- Slimmed `CheckoutCard`: loading / ready / price_changed / failed / completed / terminal error panels + Share

## Data mapping

| Concern                                                        | Source                                |
| -------------------------------------------------------------- | ------------------------------------- |
| Price, status, expiry, session id                              | `CheckoutSession`                     |
| Artist, venue, city, datetime                                  | `DEMO_EVENT`                          |
| Section, row, seatCount, Super Deal, urgency count, map bubble | `LISTING_FIXTURES[session.listingId]` |
| Contact / ticket-delivery email                                | Static string in `checkout.copy`      |
| Ticket protection, promo, guarantee copy                       | `checkout.copy` only                  |

**Price display rule:** Line item and Total both use `formatCurrency(acknowledgedPrice)`. Optional secondary text may note seat count (e.g. “· 2 seats”). Do **not** display `$154.00 × 2 = $308.00` — inventory `priceCents` is already the listing total for the held seats.

Missing fixture for a `listingId`: degrade gracefully (show listing id / omit map highlight / omit Super Deal) rather than crashing.

## Component boundaries

```
apps/web                          apps/mobile-web
  header + two-column CSS           light stack + sticky footer
  SSR OrderSummary (DOM+CSS vars)   RN composition of shared blocks
  CheckoutClient → CheckoutCard     CheckoutScreen → CheckoutCard
                 │                                  │
                 └────────── @repo/ui ──────────────┘
                   mapCheckoutPresentation.util
                   EventSummary, PriceBreakdown,
                   SuperDealBanner, UrgencyBanner,
                   GuaranteePanel, TicketProtectionCard
                   CheckoutCard (state + share)
                          │
                   LISTING_FIXTURES / DEMO_EVENT
                   @repo/tokens
```

**Web SSR:** Right-column summary remains DOM + CSS custom properties so first paint still shows event/price without JS. Shared RN blocks may power the client left column and/or a client enhancement; do not regress no-JS summary of price/session.

**File naming** (per `AGENTS.md`): `checkout.copy.ts`, `checkout.view-model.ts`, `mapCheckoutPresentation.util.ts`, PascalCase components, colocated `*.test.ts(x)`.

## States, share, tokens

### View states

| Kind                                                                                  | Layout behavior                                                                                                                           |
| ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `ready`                                                                               | Full shell; primary CTA = continue/complete; Share if shareable                                                                           |
| `price_changed`                                                                       | Shell stays; CTA region = price-changed banner + confirm                                                                                  |
| `failed`                                                                              | Shell stays; retry + Share if shareable                                                                                                   |
| `completed` / `expired` / `unavailable` / `claimed_elsewhere` / `not_found` / `error` | Status panel primary; hide buy CTA and decorative ticket-protection / promo; web right summary may remain read-only when session is known |
| `loading` (mobile)                                                                    | Spinner; no decorative payment-adjacent chrome                                                                                            |

### Share

Unchanged behavior (web clipboard / mobile `Share` API). Placement: secondary control near CTA. Hidden when session is not shareable (`isShareableSession`).

### Tokens

- Use `@repo/tokens` exclusively for color, space, radius, type.
- If the mock needs a color not in the palette (e.g. guarantee purple), add it once to `palette.js` / `colors.ts` / CSS vars — no one-off hex in feature files.
- Web shell continues to use CSS variables from `cssVariables`; mobile uses `spacePx` / theme / `colors`.

## Testing

- Unit: `mapCheckoutPresentation.util` (fixture join, Super Deal / urgency conditionals, missing fixture).
- Unit: shared banner components where behavior is non-trivial.
- Update `CheckoutCard` and web checkout client/page tests so continuity assertions still pass under the new structure.
- Manual check against `mocks/references/gametime-web-checkout.png` and `gametime-mobile-checkout.png` for spacing hierarchy (not pixel perfection).

## Success criteria

1. Web checkout first viewport reads as the two-column Gametime checkout (minus payment methods).
2. Mobile checkout reads as the light stacked mobile mock (minus Payment / Apple Pay).
3. Resume → complete / confirm-price / share / conflict / expiry still work on both surfaces.
4. No new raw hex/spacing literals outside `@repo/tokens`.
5. Web SSR still shows order summary price without a client-only flash for happy path.
