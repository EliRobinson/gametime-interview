# Session: Shared UI tokens + react-native-web (2026-07-28)

## Summary

Closed FUTURE-IMPROVEMENTS item 1 (literal component sharing between `apps/web` and
`apps/mobile-web`) by introducing `@repo/tokens`, expanding `@repo/ui` into an atomic-design
checkout library, and wiring both checkout surfaces to render the shared `CheckoutCard` via
react-native-web in Next.js. Storybook and Solito were explicitly scoped out.

## Design decisions

- **Token-first styling:** `@repo/tokens` owns colors, spacing, and typography. A CJS
  `preset.js` feeds NativeWind/Tailwind; `css-vars.ts` mirrors the same values for Next.js
  `:root` injection so web SSR and mobile stay visually aligned without duplicating hex
  literals in app code.
- **Atomic design in `@repo/ui`:** Atoms → molecules → `CheckoutCard` organism. Presentation
  logic (`CheckoutView`, `viewFromSession`, `viewFromErrorCode`, `CHECKOUT_COPY`) lives in the
  UI package; apps only wire tRPC mutations and pass `busy`/callbacks — no tRPC inside UI.
- **react-native-web in `apps/web`:** Chosen over maintaining a parallel DOM checkout to
  satisfy the original FUTURE-IMPROVEMENTS gap. Next.js keeps server-rendered initial session
  on the checkout route; the client hydrates into the same RN primitives mobile uses.
- **Out of scope:** Storybook catalog, Solito cross-app navigation, retiring
  `apps/mobile-web`'s web target entirely (decision #8's long-term consolidation path).

## Implementation plan (Tasks 1–8)

| Task | Scope                                              | Status                               |
| ---- | -------------------------------------------------- | ------------------------------------ |
| 1    | `@repo/tokens` package + preset + CSS vars         | Done                                 |
| 2    | Atoms: Text, Button, Banner, Notice, Spinner       | Done                                 |
| 3    | Molecules: Panel, PriceRow, ActionStack            | Done                                 |
| 4    | CheckoutView mappers + CheckoutCard organism       | Done                                 |
| 5    | Next.js RN-web + NativeWind + globals              | Done                                 |
| 6    | Web checkout → shared CheckoutCard (SSR preserved) | Done                                 |
| 7    | Mobile checkout → shared CheckoutCard              | Done                                 |
| 8    | Docs cleanup + `mocks/` screenshots                | Done (web + mobile PNGs in `mocks/`) |

## What landed (branch `shared-ui-tokens`)

- **`packages/tokens`:** `colors`, `space`, `typography`, `preset.js`, `css-vars` + tests.
- **`packages/ui`:** Full checkout component tree; both apps import `CheckoutCard` and view
  mappers; platform-specific code limited to tRPC wiring and layout shells.
- **`apps/web`:** `next.config.js` transpiles `@repo/ui`; NativeWind + token CSS vars in
  layout; `checkout-client.tsx` delegates rendering to `CheckoutCard`.
- **`apps/mobile-web`:** `app/checkout/[id].tsx` refactored to the same shared card.

## Verification

```
pnpm --filter @repo/tokens test   # PASS
pnpm --filter @repo/ui test       # PASS
pnpm --filter web test            # PASS
pnpm --filter mobile-web test     # PASS
```

## Follow-ups

- Screenshots captured: `mocks/web-checkout-active.png`, `mocks/mobile-checkout-active.png`.
- Cross-surface E2E (decision #9) still manual-only.
- Optional polish: preset hex drift guard; populate `newPriceCents` from API on price-change.
