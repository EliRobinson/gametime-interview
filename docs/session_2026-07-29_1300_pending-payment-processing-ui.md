# Session — `pending_payment` → processing UI

**Date:** 2026-07-29 13:00  
**Slug:** `pending-payment-processing-ui`

## Summary

Fixed a continuity UI gap: `pending_payment` was mapped like an active checkout
(`ready` / Buy enabled). Industry-standard checkout treats “charge in flight” as
a non-actionable state. We added a dedicated `processing` view and flip into it
as soon as the fan taps Buy (and whenever resume returns `pending_payment`).

## Decision (what we chose and why)

**Chose: dedicated `CheckoutView` kind `processing`**, distinct from
`claimed_elsewhere`.

| View                | When                                                                  | Fan message                    | Buy CTA? |
| ------------------- | --------------------------------------------------------------------- | ------------------------------ | -------- |
| `processing`        | Session status is `pending_payment`, or this surface just pressed Buy | “Payment in progress…”         | No       |
| `claimed_elsewhere` | `complete` returns `CONFLICT` (another surface won the CAS)           | “Finishing on another device…” | No       |

### Why not only reuse `claimed_elsewhere`?

That copy blames _another_ device. The surface that successfully claimed the
session is not “elsewhere” — it is mid-charge. Payment products (Stripe
PaymentIntents, ticket checkouts, etc.) almost always show a local
**processing** screen on the claiming client and a **taken over / in progress
elsewhere** screen for losers. Same “don’t buy again” outcome, different trust
copy.

### Why this is the right demo-sized cut

- Small change: mapper + card + optimistic `setView` before `await complete`.
- No webhooks, polling, or stuck-claim sweeper (still listed under “with more
  time”).
- Keeps the existing CAS / `ConflictError` model untouched — UI now matches it.

### Explicitly deferred

- Async PSP confirmation + resume polling / SSE while `processing`.
- Stuck `pending_payment` TTL → `failed` / expire.
- Idempotency keys on `PaymentProvider.charge`.

## Implementation notes

- `viewFromSession`: `pending_payment` → `{ kind: 'processing', session }`.
- Web + mobile `complete`: set `processing` _before_ the network call so Buy
  cannot be double-tapped during the round trip.
- `processing` is treated like other non-purchase terminal chrome (no share,
  no decorative urgency/promo).
- Leave-hold guards stay tied to _shareable_ sessions, so a mid-charge session
  is not released from the processing screen.

## Key files

- `packages/ui/.../checkout.view-model.ts`, `checkout.copy.ts`, `CheckoutCard.tsx`
- `packages/ui/.../mapCheckoutView.util.ts`
- `apps/web/.../checkout-client.tsx`
- `apps/mobile-web/app/checkout/[id].tsx`
