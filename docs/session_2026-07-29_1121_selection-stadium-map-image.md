# Session — Selection screen stadium map image

**Date:** 2026-07-29 11:21  
**Slug:** `selection-stadium-map-image`

## Summary

Applied the same Gametime CenturyLink Field stadium photo to the ticket selection map (`ListingsMap`), replacing the purple/green CSS schematic. Price bubbles stay overlaid and selectable.

## Changes

- `ListingsMap`: RN `Image` from `stadiumMapImageUrl` (default encode width **1280** for the large selection pane)
- Bubbles unchanged (fixture `%` positions, super-deal styling, disabled opacity)
- Tests: image CDN URI + bubble press still selects a listing
