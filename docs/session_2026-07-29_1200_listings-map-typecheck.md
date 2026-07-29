# Session: Fix ListingsMap test typecheck

**Date:** 2026-07-29 ~12:00 PT

## Summary

CI `pnpm typecheck` failed in `@repo/ui` with TS7006 on `ListingsMap.test.tsx`: the `forEach` callback parameter `label` was implicitly `any` because `findAllByType` is untyped without `@types/react-test-renderer`.

## Fix

Annotated the callback parameter with a structural type for the props accessed in the assertion (`props.style.color`). Typecheck for `@repo/ui` passes again.
