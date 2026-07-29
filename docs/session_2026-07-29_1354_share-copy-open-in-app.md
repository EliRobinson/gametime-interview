# Session: share Copy clipboard + remove Open in app

**Date/time:** 2026-07-29 ~13:54 PT

## Summary

Fixed mobile Share → Copy leaving an empty clipboard, and removed the web
**Open in app** control after custom-scheme handoff proved too volatile from
the browser.

## Root causes

1. **Empty clipboard on iOS Copy:** After the earlier “2 Links” fix, mobile
   passed only `{ url }` into `Share.share` on iOS. The native share sheet’s
   Copy activity often leaves the pasteboard empty in that case. Passing both
   `message` and `url` had caused duplicate link items.
2. **Open in app:** Web used `window.location.assign(mobileweb://…)`, which
   navigates the checkout page away and still fails when the scheme isn’t
   registered. `target="_blank"` / `window.open` would keep the page but
   wouldn’t make deep links reliable across browsers/machines.

## What changed

- `buildNativeSharePayload(webUrl)` → `{ message: webUrl }` only (shared util +
  tests). Mobile checkout uses it for `Share.share`.
- Removed `onOpenInApp` from `ShareTickets` / `CheckoutCard` / web client and
  the related copy.
- README notes: Open in app removed as too volatile; use `simctl openurl` for
  local deep-link demos.

## Tradeoff

Message-only keeps one share item and makes Copy paste the HTTPS resume URL.
Web → native handoff stays out of scope for the demo (already documented).
