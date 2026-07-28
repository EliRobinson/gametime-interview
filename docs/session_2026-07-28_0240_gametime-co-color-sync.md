# Session: gametime.co color sync

**Date/time:** 2026-07-28 ~02:40 PT  
**Branch:** `shared-ui-tokens` (PR #4)

## Summary

Refined `@repo/tokens` to match live [gametime.co](https://gametime.co/) brand colors (logo SVG + main CSS), replacing the earlier screenshot-approximated mint `#00D692`.

## Source samples

| Role            | Hex       | Source                           |
| --------------- | --------- | -------------------------------- |
| Brand mint      | `#19CE85` | Logo SVG fill                    |
| Ink / body text | `#010314` | Dominant in main CSS (~101 hits) |
| Continue CTA    | `#141517` | Marketing “Continue” button      |
| Dark canvas     | `#0C0C0D` | Site fills / dark surfaces       |
| Dark surface    | `#1C1C20` | Body / Log In button bg          |
| Border          | `#DFE2E7` | Light UI borders                 |
| Urgency yellow  | `#FBE217` | Site accent yellow               |
| Muted           | `#5A5A5A` | Secondary text                   |

Derived: `accentDark` `#15AF71`, `accentMuted` `#DCF7EC`, `accentLight` `#52DAA3`.

## Changes

- Updated `packages/tokens/src/colors.ts`, `preset.js`, and `css-vars.test.ts`
- UI atoms already consume `colors.*` StyleSheet tokens — no component hex edits needed
- Tests: `@repo/tokens` + `@repo/ui` pass
- Commit: `fix(tokens): align palette with live gametime.co brand colors` (`28c101e`)
