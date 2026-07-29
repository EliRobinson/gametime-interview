# Session: Background session-expiry sweeper

**Date:** 2026-07-29 ~1530 PT

## Summary

Added an in-process background sweeper so session TTL lapse frees inventory without
waiting for the next fan touch.

## Design (approved)

- Domain: `CheckoutService.expireLapsedSessions()` — shared lapse helper with request-time
  `expireIfNeeded` (CAS to `session_lapsed`, then `releaseHold`). Skips `pending_payment`.
- Store: `SessionStore.list()` for full scan (prototype).
- Glue: `SessionExpirySweeper` (~30s), started from `apps/api/src/index.ts`, stopped on
  SIGINT/SIGTERM.
- Docs: ADR #15, README, CONTEXT, design spec under `docs/superpowers/specs/`.

## Honesty

Single-process demo glue — not multi-replica safe. Production needs a real job runner and
an indexed `expiresAt` query.
