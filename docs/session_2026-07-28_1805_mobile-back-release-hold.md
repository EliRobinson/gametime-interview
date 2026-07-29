# Session — Mobile back releases ticket hold

**Date:** 2026-07-28 18:05  
**Slug:** `mobile-back-release-hold`

## Summary

Tapping back on mobile checkout now releases the inventory hold so the listing is selectable again on the selection screen.

## API

Added `CheckoutService.releaseSession` + `checkout.release` tRPC mutation:

- Releases the listing hold
- Expires the session with `expiryReason: 'hold_released'`
- Emits `session_released`
- No-op for `completed` (sold inventory stays unavailable)
- `ConflictError` if `pending_payment` (another surface mid-charge)

## Mobile

`checkout-back` calls `checkout.release` (best-effort), then `router.back()`. Navigation still proceeds if release fails.

## Tests

- Service + router coverage for release / completed no-op / pending_payment conflict
- Mobile: back triggers release; back still works when release errors
