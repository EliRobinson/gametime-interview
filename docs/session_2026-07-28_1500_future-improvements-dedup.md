# Session: Future Improvements dedup (2026-07-28)

## Summary

Read `FUTURE-IMPROVEMENTS.md` and implemented both listed items, scoped to what was actually
duplicated in the code (rather than the literal wording) after investigating the current state
of the two apps and shared packages. Work was split into two independent pieces and run in
parallel via subagents in isolated git worktrees, then merged sequentially.

## Investigation

Before implementing, checked whether the two FUTURE-IMPROVEMENTS items still matched reality:

- **Item 2 ("const enums for session/status states")**: `CheckoutSessionStatus` turned out to
  already be a single shared Zod enum in `packages/api-contracts`, correctly imported by both
  apps — nothing to fix there. What _was_ duplicated: `apps/api/src/domain/events.ts` defined its
  own `Surface = 'web' | 'mobile'` type instead of reusing `CheckoutSurface` from
  `packages/api-contracts`, and both `apps/web/app/checkout/[id]/checkout-client.tsx` and
  `apps/mobile-web/app/checkout/[id].tsx` independently reimplemented a switch over bare tRPC
  wire error-code string literals (`'PRECONDITION_FAILED'`, `'CONFLICT'`, `'TIMEOUT'`,
  `'UNPROCESSABLE_CONTENT'`, `'NOT_FOUND'`).
- **Item 1 ("shared components between apps/web and apps/mobile-web")**: literal JSX can't be
  shared as-is — `apps/web` renders plain DOM with inline styles, `apps/mobile-web` renders React
  Native/NativeWind. What _is_ duplicated: price formatting. `apps/web/src/format.ts` had its own
  `formatCents`, `apps/mobile-web/app/checkout/[id].tsx` had its own inline `formatPrice` — both
  reimplementing the same cents-to-dollar-string logic that `packages/utils`'s `formatCurrency`
  (via `Intl.NumberFormat`) already provided but nobody used.

Surfaced this scoping gap to the user before proceeding, since a literal reading of item 1 would
have meant a much larger change (adopting react-native-web in `apps/web`). Agreed to: do the two
dedup workstreams in parallel now, defer react-native-web adoption as a separate, larger,
sequential follow-up given its risk (bundler config, CSS/Tailwind vs NativeWind interop,
SSR/hydration behavior).

## Implementation

Two subagents ran in parallel, each in its own git worktree, with prompts explicitly scoping them
away from each other's files to avoid conflicts:

**Agent A — enum/error-code consolidation:**

- Removed `Surface` from `apps/api/src/domain/events.ts`, switched to `CheckoutSurface` from
  `@repo/api-contracts` (also updated `checkout-service.ts`'s signatures).
- Added `CHECKOUT_ERROR_CODE` (a plain `as const` object) and `CheckoutErrorCode` type to
  `packages/api-contracts/src/schemas/checkout.ts`, covering the five codes this flow actually
  throws.
- Updated `apps/api/src/routers/checkout.ts`'s `toTRPCError` and both checkout screens'
  error-handling switches to reference `CHECKOUT_ERROR_CODE.*` instead of string literals.

**Agent B — price-formatting consolidation:**

- Removed `formatCents` from `apps/web/src/format.ts` and the inline `formatPrice` from
  `apps/mobile-web/app/checkout/[id].tsx`.
- Added `@repo/utils` as a workspace dependency to both `apps/web` and `apps/mobile-web`, wired
  both checkout screens to call `formatCurrency` directly.
- Verified `Intl.NumberFormat`'s output matches the existing hardcoded test fixtures (all under
  $1,000, so no thousands-separator mismatch).

Both agents ran `typecheck`/`lint`/`test` independently before reporting back — all green in
isolation.

## Merge

Committed each worktree's changes (conventional-commit format, required by this repo's
commitlint config), merged Agent A's branch first (fast-forward), then Agent B's (one conflict,
in the import lines of `checkout-client.tsx` — both agents added an import to the same line
range; trivial to combine, kept both `CHECKOUT_ERROR_CODE` and `formatCurrency` imports). Ran
`pnpm install`, then `typecheck`/`lint`/`test` across the full merged tree — all 7 turborepo
tasks passed (api 30 tests, web 17, mobile-web 12, utils 3, api-contracts 5, ui 1).

Updated `FUTURE-IMPROVEMENTS.md` to record what was done and what's still open (react-native-web
adoption for literal component sharing), so the file stays an accurate punch list rather than
going stale.

## Files changed

- `apps/api/src/domain/events.ts`
- `apps/api/src/domain/checkout-service.ts`
- `apps/api/src/routers/checkout.ts`
- `packages/api-contracts/src/schemas/checkout.ts`
- `apps/web/app/checkout/[id]/checkout-client.tsx`
- `apps/web/src/format.ts`
- `apps/web/package.json`
- `apps/mobile-web/app/checkout/[id].tsx`
- `apps/mobile-web/package.json`
- `pnpm-lock.yaml`
- `FUTURE-IMPROVEMENTS.md`

Branch: `consolidate-future-improvements` (not merged to `main`; left for review).
