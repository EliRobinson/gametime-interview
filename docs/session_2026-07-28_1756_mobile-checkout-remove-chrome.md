# Session — Remove mobile checkout chrome

**Date:** 2026-07-28 17:56  
**Slug:** `mobile-checkout-remove-chrome`

## Summary

Removed Ticket Protection from mobile checkout. Stadium map was briefly removed, then restored stacked full-width above the event summary.

## Changes

In `apps/mobile-web/app/checkout/[id].tsx`:

- Dropped `TicketProtectionCard` (and its import).
- `CheckoutStadiumMap` sits above `EventSummary`, full horizontal width (`height: 160`) — not a narrow side thumbnail.

Web checkout is unchanged.
