# Session: mobile checkout CI timeout

**Date:** 2026-07-28 13:52

## Summary

Fixed CI failure on `shared-ui-tokens`: `CheckoutScreen › shows a loading state, then the active checkout state once resumed` exceeded the 15s Jest `testTimeout` on GitHub Actions under coverage load.

## Cause

- jest-expo’s first RN render + `--coverage` is expensive; prior green runs already spent ~20s on `checkout.test.tsx`.
- Under parallel turbo package suites, cold-start of the first checkout test exceeded 15s (suite reported ~26s on the failing run).
- Other 11 tests in the file passed once the worker was warm — behavior was fine; budget was not.
- Secondary: `mockResolvedValue` can settle inside RTL `act()`, so asserting loading _then_ ready is racy; not the CI timeout signature, but made the loading assertion unreliable.

## Changes

1. `apps/mobile-web/jest.config.js` — `testTimeout` 15s → 30s (same rationale as existing comment).
2. `apps/mobile-web/app/__tests__/checkout.test.tsx` — hold `resume` pending until after the loading assertion, then resolve to ready.

## Verification

`pnpm run test --ci --coverage` in `apps/mobile-web` — 12/12 pass (cold cache).
