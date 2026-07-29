# Session — Price update UX (15s timer, totals, strikethrough)

**Date:** 2026-07-29 13:15  
**Slug:** `price-update-ux-15s`

## Summary

Polished the demo price-change path and checkout price math: 15s timed bump
with a floating countdown, consistent 8px gaps on the CTA stack, order totals
as unit × seats, and strikethrough on the Tickets row only after the fan
confirms the new price.

## Decisions

- **Strikethrough timing:** Not during `price_changed` (banner + confirm CTA
  only). After `confirmPrice`, `ready` carries `previousUnitPriceCents` so
  Tickets shows `$89.00` struck + `$109.00` (unit). Total uses the new unit ×
  seats.
- **Demo delay:** `DEMO_PRICE_CHANGE.afterMs` 30s → 15s; listing label
  `Sec 118 · 15s price demo`; floating `DemoPriceCountdown` while ready.
- **Totals:** `mapCheckoutPresentation` treats `acknowledgedPrice` as per-ticket
  (matches listings “each”) and sets `totalCents = unit × seatCount` (or ×1 when
  seats unknown). Web OrderSummary is driven by live client presentation so
  confirm updates the aside immediately.
- **Spacing:** CTA / share / price-change stacks use 8px (`theme.space[2]` /
  `gap: 8`).

## Key files

- `packages/api-contracts/src/demo-price-change.ts`
- `packages/ui/.../mapCheckoutPresentation.util.ts`, `PriceBreakdown.tsx`,
  `DemoPriceCountdown.tsx`, `CheckoutCard.tsx`
- `apps/web/.../checkout-client.tsx`, `order-summary.tsx`
- `apps/mobile-web/app/checkout/[id].tsx`
