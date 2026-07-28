# Session: shared-ui quality remediation

**Date/time:** 2026-07-28 13:07  
**Branch:** `shared-ui-tokens`

## Summary

Implemented the thermo-nuclear review fixes: unified `@repo/ui` on Theme + StyleSheet (dropped NativeWind inside UI), completed `CheckoutView` (`ready` / `completed` / `failed`), made tokens a real single source (`palette.js` / `spacing.js` / `type-scale.js` → TS + preset), shared `trpcErrorCode` + `priceUpdatedNotice`, deleted `ActionStack`, moved product copy out of `Spinner`, and relocated checkout into `features/checkout/` (feature module — industry-standard home for copy + view-model next to the card).

## Decisions

- **Feature vs organism for copy/types:** Not a smell to colocate copy + view-model with the screen component. Atomic Design’s “organism” folder _was_ the smell — those files aren’t organisms. Renamed to `features/checkout/` with prefixed files (`checkoutCopy`, `checkoutViewModel`, `mapCheckoutView`, `CheckoutCard`).
- **Styling:** StyleSheet + `Theme` maps (light/dark) as the only path inside `@repo/ui`. Apps may still use NativeWind for their own chrome; web SSR shell stays DOM + CSS vars from tokens.
- **Tokens:** CJS raw modules are the sole hex/px source; TS re-exports and `preset.js` both require them. Avoided `typography.js` filename (collides with `typography.ts` under Jest).

## Verification

`pnpm` test + typecheck + lint green for tokens, utils, ui, web, mobile-web.
