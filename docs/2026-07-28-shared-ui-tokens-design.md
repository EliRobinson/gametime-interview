# Shared UI + Tokens Design

**Date:** 2026-07-28  
**Status:** Approved  
**Scope:** Unify `apps/web` and `apps/mobile-web` checkout visuals via Atomic Design in `@repo/ui`, with a new `@repo/tokens` package, and `react-native-web` in Next.js.

## Problem

Checkout is implemented twice with different styling stacks:

- **Web** (`apps/web`): DOM + inline style objects; no `@repo/ui`
- **Mobile** (`apps/mobile-web`): React Native + NativeWind; uses `@repo/ui` `Button` only

Logic/contracts are already partly shared (`@repo/api-contracts`, `formatCurrency`). Visual patterns, copy, and layout are not. `FUTURE-IMPROVEMENTS.md` called out full JSX sharing as deferred because of the RN vs DOM split.

## Goals

1. One visual language for checkout on both surfaces.
2. True component reuse (single RN component tree), not dual `.web.tsx` / `.native.tsx` implementations.
3. Tokens live in their own package — UI never owns hex/spacing literals.
4. Preserve web SSR: first paint still shows session/price without a client loading flash.
5. Capture post-conversion screenshots in top-level `mocks/`.

## Non-goals

- Broader design system beyond checkout (home demo, forms, nav).
- Retiring Expo’s web target.
- Changing the checkout domain/API or continuity semantics.
- Publishing packages externally.

## Decisions (from brainstorming)

| Choice                 | Decision                                                                  |
| ---------------------- | ------------------------------------------------------------------------- |
| Sharing model          | Expand `@repo/ui` as RN + NativeWind; Next renders via `react-native-web` |
| Visual source of truth | New token set; neither app’s current look is canonical                    |
| Token home             | New `packages/tokens` (`@repo/tokens`), not inside `@repo/ui`             |
| Atomic scope           | Checkout-only: atoms → molecules → one organism                           |
| Packaging              | Tokens → Tailwind/NativeWind preset + CSS vars; UI depends on tokens      |

---

## 1. Packages

```
packages/
  tokens/          # NEW — sole source of visual truth
  ui/              # Atomic RN + NativeWind; depends on @repo/tokens
  api-contracts/   # unchanged
  utils/           # unchanged
  config/          # tooling only; Tailwind theme values move to tokens
```

### `@repo/tokens`

Exports:

- **Raw values:** `colors` (primary, primaryLight, primaryDark, surface, muted, bannerBg, bannerBorder, border, noticeBorder), `space`, `radius`, `fontSize`, `fontWeight`
- **Tailwind/NativeWind preset** built from those values (both apps consume it)
- **CSS custom properties** for Next layout chrome so SSR HTML matches client styles

Rules:

- `@repo/ui` never hardcodes hex or spacing — only token names / NativeWind classes from the preset
- Apps do not invent local colors for checkout chrome
- `@repo/config/tailwind` becomes a thin re-export of `@repo/tokens`’s preset for one release so existing `require('@repo/config/tailwind')` callers keep working; new code imports from `@repo/tokens`

### `@repo/ui`

- Peer deps: `react`, `react-native` (satisfied on web by `react-native-web`)
- Depends on: `@repo/tokens`, `@repo/utils` (for price display formatting inside molecules/organism), `@repo/api-contracts` (for organism view types tied to session status — keep thin)
- Structure by Atomic Design folders (see §2)

---

## 2. Atomic inventory (checkout-only)

### Atoms (no domain knowledge)

| Component | Role                                                              |
| --------- | ----------------------------------------------------------------- |
| `Text`    | Variants: `title`, `body`, `muted`, `total`, `eyebrow`            |
| `Button`  | Existing; add `disabled` and busy/label support as needed         |
| `Banner`  | Warning/alert strip (price-change tone)                           |
| `Notice`  | Info/status strip; expose accessibility as status/alert via props |
| `Spinner` | Loading indicator + optional label                                |

### Molecules

| Component     | Role                                        |
| ------------- | ------------------------------------------- |
| `Panel`       | Title + body + optional actions slot        |
| `PriceRow`    | “Total” label + formatted amount            |
| `ActionStack` | Vertical stack for CTAs / secondary content |

### Organisms

| Component      | Role                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------- |
| `CheckoutCard` | Renders from a shared **view model**. Apps own data fetching; organism maps view → UI only. |

### Shared copy / view model

Both screens currently duplicate ended/completed/failed/price-changed copy and map tRPC errors differently.

- Introduce a shared `CheckoutView` (align with mobile’s existing `kind` union) plus copy constants next to the organism (e.g. `packages/ui/src/organisms/checkout/`).
- Apps map tRPC/`CHECKOUT_ERROR_CODE` → `CheckoutView`; web adopts the same shape.
- Apps keep: routing, tRPC calls, SSR resume (web), deep-link resume (mobile).

Optional molecule: `CheckoutSummary` for the SSR listing `<dl>` (listing / status / holds until) if it can stay RN-friendly; otherwise leave as a thin web-only shell using token CSS vars.

---

## 3. Next.js + `react-native-web` + SSR

### Dependencies (`apps/web`)

Add: `react-native-web`, `react-native` (peer satisfaction / types as needed), `nativewind`, `tailwindcss`, `@repo/ui`, `@repo/tokens`.

### Config

1. `next.config.js`:
   - Alias `react-native` → `react-native-web`
   - `transpilePackages: ['@repo/ui', '@repo/tokens', ...]` as required
2. Tailwind content globs include `packages/ui` and app routes; preset from `@repo/tokens`
3. Root layout imports `globals.css` (`@tailwind` layers + CSS vars from tokens)
4. Interactive checkout remains `'use client'`; mounts `CheckoutCard` with `initialSession` — **no client refetch on mount** (preserves no-flash SSR)
5. Server page still resumes session and renders summary + client island

### Mobile

- Point Tailwind preset at `@repo/tokens`
- Replace local `Panel` / duplicated markup with shared atoms → `CheckoutCard`
- No architectural change beyond consuming shared UI

### Tests

- Update web/mobile checkout tests to shared `testID`s / roles from `@repo/ui`
- Keep SSR / `renderToStaticMarkup` (or equivalent) proving pre-hydration content still includes price/status

### Screenshots

After conversion, store under top-level `mocks/`, e.g.:

- `mocks/web-checkout-active.png`
- `mocks/mobile-checkout-active.png`

(Additional states optional if easy: price-changed, completed, expired.)

---

## 4. Data flow

```
API (unchanged)
  ↓ resume / complete / confirmPrice
apps/web (SSR resume) or apps/mobile-web (client resume)
  ↓ map session + errors → CheckoutView
@repo/ui CheckoutCard
  ↓
atoms / molecules
```

`CheckoutCard` props (conceptual):

- `view: CheckoutView`
- `busy: boolean`
- callbacks: `onComplete`, `onConfirmPrice` (only when view allows)

No tRPC inside `@repo/ui`.

---

## 5. Error handling & a11y

- Price-change: `Banner` with alert semantics; confirm CTA required before complete
- Conflict / notices: `Notice` with status semantics
- Buttons: `accessibilityRole="button"`, disabled when `busy` or blocked by price-change
- Loading: `Spinner` + muted label (mobile resume only; web SSR avoids this path for happy path)

---

## 6. Risks & mitigations

| Risk                                              | Mitigation                                                                                               |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Next + RN-web + NativeWind SSR/hydration mismatch | CSS vars + Tailwind on server; verify static markup test; pin known-good NativeWind v4 + RN-web versions |
| Bundle size / transpile cost                      | Limit shared UI to checkout atoms/molecules/organism                                                     |
| Copy drift if left in apps                        | Centralize copy next to `CheckoutCard`                                                                   |
| Jest/DOM vs RN testing on web                     | Prefer `@testing-library/react` with RN-web; align testIDs                                               |

---

## 7. Success criteria

- [ ] `@repo/tokens` is the only place defining checkout colors/spacing/type scale
- [ ] Both apps render checkout through `@repo/ui` Atomic components (no parallel inline-style card on web)
- [ ] Web first paint still shows session summary + price without client resume flash
- [ ] Existing checkout unit tests updated and passing; SSR smoke still green
- [ ] Screenshots in `mocks/` for web and mobile checkout

## Out of scope follow-ups

- Full Solito / universal routing
- Storybook for `@repo/ui`
- Expanding Atomic kit beyond checkout
- Removing Expo web target
  )
