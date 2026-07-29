# Session: Stadium map star contrast consistency

**Date:** 2026-07-29 ~11:40 PT

## Summary

Unified the stadium map Super Deal star (and bubble glyph/label) color across web checkout, mobile checkout, and ticket selection. Chose dark ink over white for accessibility against accent green `#19CE85`.

## Decision

Contrast against `colors.accent` (`#19CE85`):

| Glyph                        | Ratio  | WCAG AA (4.5:1) |
| ---------------------------- | ------ | --------------- |
| White / `onDark` (`#F9F9FA`) | ~2.0:1 | Fail            |
| Dark / `canvas` (`#0C0C0D`)  | ~9.5:1 | Pass (AAA)      |

Match existing `SuperDealBanner` star, which already used `colors.canvas` on accent.

## Why web vs mobile differed

- **Web checkout** (`order-summary.tsx`): `mapBubble` style hardcoded `color: var(--color-on-dark)` (near-white).
- **Mobile checkout** (`CheckoutStadiumMap`): `Text variant="eyebrow"` used `theme.text` (near-black on light theme).
- **Selection** (`ListingsMap`): always `colors.onDark` for labels — white on green for Super Deals.

## Changes

- `ListingsMap`: Super Deal labels → `colors.canvas`; standard → `colors.onDark`.
- `CheckoutStadiumMap`: same pairing for ★ / ● (explicit `RNText` color, not theme text).
- Web `OrderSummary`: set bubble `color` from `isSuperDeal` (`--color-canvas` vs `--color-on-dark`); removed fixed light color from shared `mapBubble` style.
- Tests for both map components covering glyph/label color by deal type.
