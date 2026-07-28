# Session: Expo-interactive dev scripts

**Date:** 2026-07-28 ~12:31

## Summary

Turborepo’s multiplexed `pnpm dev` doesn’t give Expo a TTY, so Expo CLI
keypresses (`r`, `j`, etc.) don’t work. Split the root scripts so “all at once”
stays available, while servers and mobile can run in two terminals with a real
TTY for Expo.

## Decisions

- Keep `pnpm dev` as turbo for api + web + mobile-web (convenience; no Expo keys).
- Add `pnpm dev:servers` → turbo api + web only.
- Change `pnpm dev:mobile-web` to `pnpm --filter mobile-web dev` (direct Expo,
  not via turbo) so stdin works.
- Document the two-terminal preference in README “Running it” and “Getting started”.

## Changes

- Root `package.json`: `dev:servers` added; `dev:mobile-web` no longer uses turbo.
- `README.md`: both command blocks updated with the split workflow.
