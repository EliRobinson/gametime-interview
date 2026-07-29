# Session expiry sweeper

**Date:** 2026-07-29  
**Status:** Approved

## Goal

Close the abandoned-tab inventory gap: sessions past `expiresAt` free their holds
without waiting for the next resume/confirm/complete touch.

## Design

### Domain

- `CheckoutService.expireLapsedSessions(): Promise<number>` scans the store for
  non-terminal sessions past `expiresAt`, skips `pending_payment` (mid-charge),
  and for each runs the same lapse path as request-time TTL: `releaseHold` +
  expire as `session_lapsed`.
- Shared private helper used by both `expireIfNeeded` and the sweep so lazy and
  background paths cannot drift.
- Returns the count of sessions newly expired this pass.

### Store

- `SessionStore.list(): CheckoutSession[]` — full scan for the in-memory prototype.
  Production would query `expiresAt < now AND status IN ('active','failed')`.

### Process glue

- `SessionExpirySweeper` wraps the domain method with `start` / `stop` / `tick`,
  interval default ~30s, skips overlapping ticks, reports errors via callback.
- Started from `apps/api/src/index.ts` after listen; stopped on process signals.

### Non-goals

- Multi-replica leader election / distributed locks
- Inventory-owned hold TTL independent of session clock
- Persisted job queue
