# Session: Expo Go `ExpoLinking` native module fix

**Date/time:** 2026-07-28 ~12:35–12:40 PT

## Summary

iOS Simulator showed Expo splash then failed with `simctl openurl ... Operation timed out`, then (once the URL opened) a RedBox: `Cannot find native module 'ExpoLinking'`. Root cause was SDK version skew: the Expo SDK 51 app had resolved `expo-linking@57` / `expo-constants@57` (SDK 54+ JS APIs) while Expo Go only ships SDK 51 native modules. Fixed by pinning SDK 51–compatible packages via `expo install`.

## What happened

1. User ran `pnpm dev:mobile-web` and pressed `i` for the simulator.
2. Terminal: `xcrun simctl openurl … exp://192.168.1.199:8081` exited with code 60 (timeout). Simulator stuck on Expo splash.
3. After opening `exp://127.0.0.1:8081`, the real error appeared: **Cannot find native module 'ExpoLinking'**.

## Diagnosis

| Hypothesis                              | Result                                                                                                            |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Simulator cannot reach Metro via LAN IP | Partially true — LAN openurl timed out once; localhost worked. Not the RedBox cause.                              |
| Expo Go missing / not booted            | False — Expo Go 2.31.6 installed; matches SDK 51 (`runtimeVersion: 51.0.0`).                                      |
| Metro cannot serve iOS bundle           | False — bundle returned 200 (~10MB).                                                                              |
| Wrong `expo-linking` version for SDK 51 | **Confirmed** — installed `57.0.2`; SDK 51 needs `~6.3.1`. `expo-constants` was also `57.0.3` (needed `~16.0.2`). |

`expo-router@3.5.24` peers `expo-linking: '*'`, so pnpm/hoisted resolution pulled latest major 57 instead of the SDK 51 line.

## Fix

```bash
cd apps/mobile-web
pnpm exec expo install expo-linking expo-constants
# → expo-linking@~6.3.1, expo-constants@~16.0.2
```

Restarted Metro with `--localhost --clear`, reopened Expo Go → iOS bundled successfully; Expo Go showed the SDK 51 developer-menu tip (project connected; RedBox gone).

## Changes

- `apps/mobile-web/package.json` — direct deps: `expo-linking`, `expo-constants`
- `pnpm-lock.yaml` — locked to SDK 51 versions

## Notes / leftovers

- TypeScript still warns (`5.9.3` vs expected `~5.3.3`) — cosmetic for this bug.
- Watchman recrawl warning (49×) — optional cleanup: `watchman watch-del … ; watchman watch-project …`.
- Peer warnings remain for `react-native-reanimated@4.5.1` / `worklets` (want RN 0.83–0.86; app is 0.74.5) from shared packages — not blocking this load path.
- For simulator, prefer `--localhost` / `exp://127.0.0.1:8081` over the LAN URL to avoid openurl timeouts.
