# Session: web checkout Cancel button

**Date/time:** 2026-07-29 ~14:05 PT (updated ~14:13)

## Summary

Added a responsive Cancel control to the web checkout header so fans can abandon
purchase the same way mobile’s back chevron does.

## Decisions

- **Placement (wide):** Layered over the header using the same max-width / padding /
  2-col grid as checkout `main` + left card `space-5` inset, so Cancel lines up
  with Contact. Title stays truly centered; Gametime logo stays full-bleed left.
- **Placement (≤800px):** Same shell collapses to 1 col (matching checkout); slot
  offsets past the logo so the control isn’t covered.
- **Chevron:** Mobile `‹` (not a literal `<`). Narrow = icon only; `sm+` = `‹ Cancel`.
- **Leave behavior:** `Link` to `/` so the existing leave guard (confirm + release)
  still runs.

## What changed

- `SiteHeader` client component (`usePathname`); copy keys; CSS alignment layer;
  tests for checkout vs landing routes.
