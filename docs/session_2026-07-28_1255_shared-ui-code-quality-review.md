# Session: shared-ui code quality review

**Date/time:** 2026-07-28 12:55  
**Branch:** `shared-ui-tokens` vs `main` (~19 commits, ~82 files)

## Summary

Thermo-nuclear code-quality review of the shared UI + tokens work. Verdict: **do not approve as-is** — behavior looks sound and the organism extraction is directionally right, but the implementation forked away from its own design (NativeWind-only atoms → StyleSheet + Appearance context) and left the view model half-finished (`kind: 'session'` still re-branches on domain status).

## Key findings (ordered)

1. **Three styling systems** in one checkout (Appearance/StyleSheet atoms, NativeWind molecules, CSS-var inline web shell) — biggest structural issue; plan said RN + NativeWind only.
2. **Incomplete `CheckoutView`** — completed/failed still handled inside `renderSession` via `session.status`; map them in `viewFromSession` so the card is a pure switch.
3. **Tokens not sole source** — `preset.js` duplicates hex; atoms hardcode radius/padding/font sizes contrary to design rules.
4. **Duplicated app orchestration** — identical `trpcErrorCode` + confirm-price notice string in web and mobile.
5. Thin `ActionStack`; brand copy in `Spinner` atom; confusing `primary = appearance === 'dark'` naming.

No source file crossed the 1k-line threshold.
