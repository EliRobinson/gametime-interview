# Session: Break @repo/tokens ↔ @repo/config circular dependency

**Date/time:** 2026-07-28 ~12:48 PT

## Summary

Turbo warned `WARNING Circular package dependency detected: @repo/tokens, @repo/config` during `pnpm lint`. Fixed by removing the temporary `@repo/config/tailwind` re-export that made config depend on tokens. Lint now completes with no circular-dependency warning.

## Cause

- `@repo/tokens` → `@repo/config` (devDependency): eslint + typescript base — correct direction.
- `@repo/config` → `@repo/tokens` (dependency): `packages/config/tailwind/index.js` re-exported `@repo/tokens/preset` as a one-release compatibility shim from the shared-UI tokens plan.

No runtime callers still used `@repo/config/tailwind` (apps already `require('@repo/tokens/preset')`).

## Change

1. Dropped `@repo/tokens` from `packages/config/package.json` dependencies.
2. Removed the `./tailwind` export.
3. Deleted `packages/config/tailwind/index.js`.
4. Ran `pnpm install` to refresh the lockfile.

Verified with `pnpm lint`: 7/7 tasks successful, no circular package dependency warning.
