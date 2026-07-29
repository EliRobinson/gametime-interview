# Session — Share one link + demo notes

**Date:** 2026-07-29 11:51  
**Slug:** `share-one-link-demo-notes`

## Summary

iOS native share was showing “2 Links” because `Share.share` passed the same HTTPS URL in both `message` and `url`. README gained a top “Notes about the demo” section explaining demo scope and intent.

## Decisions

- **iOS:** pass only `{ url }` so the sheet is one link.
- **Android:** pass only `{ message }` (Android ignores `url`).
- README notes cover: mobile→web share only (no web→native handoff), monorepo/shared-UI experiment from the maintained GitHub template, and extra polish for mobile/web parity beyond the core resume design.
