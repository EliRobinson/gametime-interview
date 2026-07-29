# Session: Post-purchase header leave label

**Date:** 2026-07-29 ~1515 PT

## Summary

After a successful purchase (“Order complete”), the web checkout header leave control
said “Cancel”. It now says **Done** — and only when the session is actually completed,
not for expired / abandoned exits.

## Changes

- Added `doneLabel` / `doneAriaLabel` to `CHECKOUT_COPY`.
- Introduced `CheckoutLeaveModeProvider` so `CheckoutClient` can tell `SiteHeader` when
  the leave affordance should read as Done vs Cancel (siblings under the root layout).
- `CheckoutClient` sets leave mode to `done` when `view.kind === 'completed'`, otherwise
  `cancel`, and resets on unmount.
- Tests cover Cancel on active checkout and Done after purchase; SSR page tests still pass
  with a default no-op context outside the provider.

## Rationale

“Cancel” implies abandoning an in-progress purchase. Once tickets are bought, the same
control is just navigation home — “Done” matches that intent. Scoped strictly to
`completed` per product ask.
