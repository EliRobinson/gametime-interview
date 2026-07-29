# Session: mobile confirm expands price details

**Date/time:** 2026-07-29 ~13:46 PT

## Summary

On mobile checkout, confirming a changed price now auto-expands the collapsed
"Show details" price breakdown so the strike-through previous unit price is
visible without an extra tap.

## What changed

- `apps/mobile-web/app/checkout/[id].tsx`: on successful `confirmPrice`, call
  `setDetailsExpanded(true)` alongside the ready view + price-updated notice.
- `apps/mobile-web/app/__tests__/checkout.test.tsx`: the existing
  acknowledge-before-complete test now asserts `previous-unit-price` and
  "Hide details" appear after confirm (no manual toggle).

## Rationale

After confirm, the fan sees the new total in the collapsed header, but the
old→new unit price comparison lives inside the expanded breakdown. Expanding
on confirm makes the reprice obvious without changing web (always expanded).
