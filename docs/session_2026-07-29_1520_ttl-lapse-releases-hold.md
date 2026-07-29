# Session: TTL lapse releases inventory hold

**Date:** 2026-07-29 ~1520 PT

## Summary

Fixed a product gap: when a checkout session hit `session_lapsed` (TTL), the session was
expired but the inventory hold was left in place. Explicit abandon via `releaseSession`
did release. That soft-conflicted with “not holding stale inventory forever.”

## Fix

`expireIfNeeded` now calls `inventory.releaseHold` before marking the session expired with
`expiryReason: 'session_lapsed'`. Reasons stay distinct for fan copy:

- `session_lapsed` — session clock died (hold freed as cleanup on that touch)
- `hold_released` — hold disappeared while the session clock was still good / explicit abandon

## Honesty note

Still no background sweeper. A hold frees on the next resume/confirm/complete after TTL,
explicit `checkout.release`, or external inventory reclaim. Documented in README, ADR #15,
and `CONTEXT.md`.

## Tests

Extended “expires a session once its expiresAt has passed” to assert the listing is free
and creatable again after lapse.
