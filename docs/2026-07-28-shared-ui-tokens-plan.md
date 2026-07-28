# Shared UI + Tokens Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify web and mobile checkout on Atomic Design components in `@repo/ui`, backed by a new `@repo/tokens` package, with Next.js rendering via `react-native-web`, then capture screenshots in `mocks/`.

**Architecture:** `@repo/tokens` owns colors/spacing/type and the Tailwind/NativeWind preset. `@repo/ui` is RN + NativeWind only (atoms → molecules → `CheckoutCard`). Apps map session/errors → `CheckoutView` and keep tRPC/routing. `apps/web` aliases `react-native` → `react-native-web` and preserves SSR resume (no client refetch on mount).

**Tech Stack:** pnpm workspaces, Turborepo, React Native / NativeWind v4, react-native-web, Next.js 14, Expo 51, Jest + Testing Library, Tailwind CSS.

**Spec:** `docs/2026-07-28-shared-ui-tokens-design.md`

## Global Constraints

- Tokens are the only place defining checkout colors, spacing, radius, and type scale — no hardcoded hex in `@repo/ui` or checkout screens.
- Shared components are React Native primitives + NativeWind; no `.web.tsx` / `.native.tsx` dual implementations.
- Checkout-only Atomic scope: atoms (`Text`, `Button`, `Banner`, `Notice`, `Spinner`), molecules (`Panel`, `PriceRow`, `ActionStack`), organism (`CheckoutCard`).
- No tRPC inside `@repo/ui`.
- Web must keep SSR first paint with session summary + price (no client resume flash on happy path).
- Variable naming: spell out meaningful identifiers (no single-letter params for sessions, etc.).
- Commits: only when the user explicitly asks (skip commit steps during execution unless requested).
- Types imports: separate `import type` from value imports.

## File structure

```
packages/tokens/
  package.json
  tsconfig.json
  eslint.config.mjs
  src/
    index.ts              # re-exports
    colors.ts             # raw color values
    space.ts              # spacing + radius
    typography.ts         # fontSize + fontWeight
    css-vars.ts           # CSS custom property string for Next globals
    css-vars.test.ts
    preset.js             # Tailwind/NativeWind preset (CJS for require())
  jest.config.js

packages/config/tailwind/index.js   # re-export tokens preset

packages/ui/src/
  atoms/
    Button.tsx            # move + enhance (disabled)
    Button.test.tsx
    Text.tsx
    Text.test.tsx
    Banner.tsx
    Banner.test.tsx
    Notice.tsx
    Notice.test.tsx
    Spinner.tsx
    Spinner.test.tsx
    index.ts
  molecules/
    Panel.tsx
    Panel.test.tsx
    PriceRow.tsx
    PriceRow.test.tsx
    ActionStack.tsx
    ActionStack.test.tsx
    index.ts
  organisms/
    checkout/
      types.ts            # CheckoutView
      copy.ts             # ended/completed/failed strings
      view.ts             # viewFromSession, viewFromErrorCode
      view.test.ts
      CheckoutCard.tsx
      CheckoutCard.test.tsx
      index.ts
  index.ts                # public exports

apps/web/
  next.config.js          # RN-web alias + transpilePackages
  tailwind.config.js      # NEW
  postcss.config.js       # NEW
  app/globals.css         # NEW
  app/layout.tsx          # import globals.css; token-based body
  app/checkout/[id]/page.tsx
  app/checkout/[id]/checkout-client.tsx
  package.json

apps/mobile-web/
  tailwind.config.js      # preset from @repo/tokens
  app/checkout/[id].tsx

mocks/                    # NEW — screenshots
  web-checkout-active.png
  mobile-checkout-active.png
```

---

### Task 1: Create `@repo/tokens`

**Files:**

- Create: `packages/tokens/package.json`
- Create: `packages/tokens/tsconfig.json`
- Create: `packages/tokens/eslint.config.mjs`
- Create: `packages/tokens/jest.config.js`
- Create: `packages/tokens/src/colors.ts`
- Create: `packages/tokens/src/space.ts`
- Create: `packages/tokens/src/typography.ts`
- Create: `packages/tokens/src/css-vars.ts`
- Create: `packages/tokens/src/css-vars.test.ts`
- Create: `packages/tokens/src/index.ts`
- Create: `packages/tokens/src/preset.js`
- Modify: `packages/config/tailwind/index.js` (re-export tokens preset)

**Interfaces:**

- Consumes: nothing (leaf package)
- Produces:
  - `colors`, `space`, `radius`, `fontSize`, `fontWeight` objects
  - `cssVariables: string` (a `:root { ... }` block)
  - CJS preset at `@repo/tokens/preset` for Tailwind `presets: [require('@repo/tokens/preset')]`

- [ ] **Step 1: Scaffold package.json and tooling**

`packages/tokens/package.json`:

```json
{
  "name": "@repo/tokens",
  "version": "0.0.0",
  "private": true,
  "main": "src/index.ts",
  "types": "src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./preset": "./src/preset.js"
  },
  "scripts": {
    "lint": "eslint . --max-warnings=0",
    "typecheck": "tsc --noEmit",
    "test": "jest"
  },
  "devDependencies": {
    "@repo/config": "workspace:*",
    "@types/jest": "^29.5.12",
    "jest": "^29.7.0",
    "ts-jest": "^29.2.4",
    "typescript": "^5.5.4"
  }
}
```

Mirror `packages/utils` for `tsconfig.json`, `eslint.config.mjs`, and `jest.config.js` (ts-jest, `roots: ['<rootDir>/src']`).

- [ ] **Step 2: Write failing css-vars test**

```ts
// packages/tokens/src/css-vars.test.ts
import { colors } from './colors';
import { cssVariables } from './css-vars';

describe('cssVariables', () => {
  it('emits a :root block that includes the primary color', () => {
    expect(cssVariables).toContain(':root');
    expect(cssVariables).toContain(`--color-primary: ${colors.primary}`);
    expect(cssVariables).toContain(`--color-muted: ${colors.muted}`);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm --filter @repo/tokens test`

Expected: FAIL (package/scripts/modules missing)

- [ ] **Step 4: Implement token modules**

```ts
// packages/tokens/src/colors.ts
export const colors = {
  primary: '#4F46E5',
  primaryLight: '#6366F1',
  primaryDark: '#4338CA',
  surface: '#FFFFFF',
  muted: '#6B7280',
  border: '#D8D8DD',
  bannerBg: '#FDF6E3',
  bannerBorder: '#B8860B',
  noticeBorder: '#8A8A90',
  text: '#111827',
} as const;

// packages/tokens/src/space.ts
export const space = {
  1: '0.25rem',
  2: '0.5rem',
  3: '0.75rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  8: '2rem',
  18: '4.5rem',
} as const;

export const radius = {
  md: '0.375rem',
  lg: '0.5rem',
} as const;

// packages/tokens/src/typography.ts
export const fontSize = {
  sm: '0.875rem',
  base: '1rem',
  xl: '1.25rem',
  '2xl': '1.5rem',
  '4xl': '2.25rem',
} as const;

export const fontWeight = {
  normal: '400',
  semibold: '600',
  bold: '700',
} as const;

// packages/tokens/src/css-vars.ts
import { colors } from './colors';
import { radius, space } from './space';
import { fontSize } from './typography';

export const cssVariables = `:root {
  --color-primary: ${colors.primary};
  --color-primary-light: ${colors.primaryLight};
  --color-primary-dark: ${colors.primaryDark};
  --color-surface: ${colors.surface};
  --color-muted: ${colors.muted};
  --color-border: ${colors.border};
  --color-banner-bg: ${colors.bannerBg};
  --color-banner-border: ${colors.bannerBorder};
  --color-notice-border: ${colors.noticeBorder};
  --color-text: ${colors.text};
  --radius-md: ${radius.md};
  --radius-lg: ${radius.lg};
  --font-size-base: ${fontSize.base};
  --space-4: ${space[4]};
  --space-5: ${space[5]};
  --space-6: ${space[6]};
  --space-8: ${space[8]};
}`;

// packages/tokens/src/index.ts
export { colors } from './colors';
export { cssVariables } from './css-vars';
export { fontSize, fontWeight } from './typography';
export { radius, space } from './space';
```

```js
// packages/tokens/src/preset.js
// Keep hex values in sync with colors.ts / space.ts / radius.ts (CJS cannot import TS cleanly).
/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4F46E5',
          light: '#6366F1',
          dark: '#4338CA',
        },
        surface: '#FFFFFF',
        muted: '#6B7280',
        border: '#D8D8DD',
        banner: { DEFAULT: '#FDF6E3', border: '#B8860B' },
        notice: { border: '#8A8A90' },
        ink: '#111827',
      },
      spacing: {
        18: '4.5rem',
      },
      borderRadius: {
        md: '0.375rem',
        lg: '0.5rem',
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 5: Re-export from `@repo/config/tailwind`**

Replace `packages/config/tailwind/index.js` body with:

```js
// Thin re-export — theme lives in @repo/tokens. Prefer require('@repo/tokens/preset').
module.exports = require('@repo/tokens/preset');
```

Add `"@repo/tokens": "workspace:*"` to `packages/config/package.json` `dependencies`.

- [ ] **Step 6: Install and run tests**

Run:

```bash
pnpm install
pnpm --filter @repo/tokens test
pnpm --filter @repo/tokens typecheck
```

Expected: PASS

- [ ] **Step 7: Commit (only if user asked)**

```bash
git add packages/tokens packages/config/tailwind/index.js packages/config/package.json pnpm-lock.yaml
git commit -m "$(cat <<'EOF'
feat: add @repo/tokens as shared design token source

EOF
)"
```

---

### Task 2: Atoms — move `Button`, add `Text` / `Banner` / `Notice` / `Spinner`

**Files:**

- Create: `packages/ui/src/atoms/Button.tsx` (move from `src/Button.tsx`)
- Create: `packages/ui/src/atoms/Button.test.tsx`
- Create: `packages/ui/src/atoms/Text.tsx`
- Create: `packages/ui/src/atoms/Text.test.tsx`
- Create: `packages/ui/src/atoms/Banner.tsx`
- Create: `packages/ui/src/atoms/Banner.test.tsx`
- Create: `packages/ui/src/atoms/Notice.tsx`
- Create: `packages/ui/src/atoms/Notice.test.tsx`
- Create: `packages/ui/src/atoms/Spinner.tsx`
- Create: `packages/ui/src/atoms/Spinner.test.tsx`
- Create: `packages/ui/src/atoms/index.ts`
- Modify: `packages/ui/src/index.ts`
- Modify: `packages/ui/package.json` (add `@repo/tokens` dependency)
- Delete: `packages/ui/src/Button.tsx`, `packages/ui/src/Button.test.tsx`

**Interfaces:**

- Consumes: NativeWind classes from tokens preset (`bg-primary`, `text-muted`, `bg-banner`, `border-banner-border`, etc.)
- Produces:
  - `Button({ onPress, children, variant?, disabled?, testID? })`
  - `Text({ variant, children, testID? })` where `variant` is `'title' | 'body' | 'muted' | 'total' | 'eyebrow'`
  - `Banner({ children, testID? })` — `accessibilityRole="alert"`
  - `Notice({ children, testID? })` — `accessibilityLiveRegion="polite"`
  - `Spinner({ label? })`

- [ ] **Step 1: Write failing Text test**

```tsx
import { render, screen } from '@testing-library/react-native';

import { Text } from './Text';

describe('Text', () => {
  it.each([
    { variant: 'title' as const, sample: 'Finish checkout' },
    { variant: 'muted' as const, sample: 'Total' },
    { variant: 'total' as const, sample: '$42.00' },
  ])('renders $variant content', ({ variant, sample }) => {
    render(<Text variant={variant}>{sample}</Text>);
    expect(screen.getByText(sample)).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @repo/ui test -- Text.test`

Expected: FAIL (module not found)

- [ ] **Step 3: Implement Text + move/enhance Button**

```tsx
// packages/ui/src/atoms/Text.tsx
import type { ReactNode } from 'react';
import { Text as RNText } from 'react-native';

const variantClass: Record<'title' | 'body' | 'muted' | 'total' | 'eyebrow', string> = {
  title: 'text-2xl font-bold text-ink',
  body: 'text-base text-ink',
  muted: 'text-base text-muted',
  total: 'text-4xl font-bold text-ink',
  eyebrow: 'text-sm uppercase tracking-wide text-muted',
};

export type TextVariant = keyof typeof variantClass;

export function Text({
  variant,
  children,
  testID,
}: {
  variant: TextVariant;
  children: ReactNode;
  testID?: string;
}) {
  return (
    <RNText className={variantClass[variant]} testID={testID}>
      {children}
    </RNText>
  );
}
```

Move `Button` into `atoms/`; add `disabled?: boolean` — when true, skip `onPress` and add opacity class (`opacity-50`).

```tsx
// Banner
export function Banner({ children, testID }: { children: ReactNode; testID?: string }) {
  return (
    <View
      accessibilityRole="alert"
      className="rounded-lg border border-banner-border bg-banner p-3"
      testID={testID}
    >
      {children}
    </View>
  );
}

// Notice
export function Notice({ children, testID }: { children: ReactNode; testID?: string }) {
  return (
    <View
      accessibilityLiveRegion="polite"
      className="rounded-lg border border-notice-border p-3"
      testID={testID}
    >
      <Text variant="body">{children}</Text>
    </View>
  );
}

// Spinner
export function Spinner({ label }: { label?: string }) {
  return (
    <View className="items-center gap-3">
      <ActivityIndicator />
      {label ? <Text variant="muted">{label}</Text> : null}
    </View>
  );
}
```

Export from `atoms/index.ts` and `src/index.ts`. Keep `export { Button } from './atoms/Button'` so existing `import { Button } from '@repo/ui'` still works.

- [ ] **Step 4: Tests for Banner, Notice, Spinner, Button disabled**

Cover: Banner has alert role; Notice renders children; Spinner shows label; disabled Button does not fire `onPress`.

- [ ] **Step 5: Run all UI tests**

Run: `pnpm --filter @repo/ui test`

Expected: PASS

- [ ] **Step 6: Commit (only if user asked)**

---

### Task 3: Molecules — `Panel`, `PriceRow`, `ActionStack`

**Files:**

- Create: `packages/ui/src/molecules/Panel.tsx`
- Create: `packages/ui/src/molecules/Panel.test.tsx`
- Create: `packages/ui/src/molecules/PriceRow.tsx`
- Create: `packages/ui/src/molecules/PriceRow.test.tsx`
- Create: `packages/ui/src/molecules/ActionStack.tsx`
- Create: `packages/ui/src/molecules/ActionStack.test.tsx`
- Create: `packages/ui/src/molecules/index.ts`
- Modify: `packages/ui/package.json` (add `@repo/utils`)
- Modify: `packages/ui/src/index.ts`

**Interfaces:**

- Consumes: `Text`, `formatCurrency` from `@repo/utils`
- Produces:
  - `Panel({ title, body, children? })`
  - `PriceRow({ amountCents, testID? })` — label “Total” + formatted amount
  - `ActionStack({ children })` — `View` with `className="gap-4"`

- [ ] **Step 1: Write failing PriceRow test**

```tsx
import { render, screen } from '@testing-library/react-native';

import { PriceRow } from './PriceRow';

describe('PriceRow', () => {
  it('shows Total and the formatted amount', () => {
    render(<PriceRow amountCents={4200} testID="acknowledged-price" />);
    expect(screen.getByText('Total')).toBeTruthy();
    expect(screen.getByText('$42.00')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `pnpm --filter @repo/ui test -- PriceRow.test`

- [ ] **Step 3: Implement molecules**

```tsx
export function Panel({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children?: ReactNode;
}) {
  return (
    <View className="gap-3">
      <Text variant="title">{title}</Text>
      <Text variant="muted">{body}</Text>
      {children}
    </View>
  );
}

export function PriceRow({ amountCents, testID }: { amountCents: number; testID?: string }) {
  return (
    <View className="gap-1">
      <Text variant="muted">Total</Text>
      <Text variant="total" testID={testID}>
        {formatCurrency(amountCents)}
      </Text>
    </View>
  );
}

export function ActionStack({ children }: { children: ReactNode }) {
  return <View className="gap-4">{children}</View>;
}
```

- [ ] **Step 4: Run UI tests — expect PASS**

Run: `pnpm --filter @repo/ui test`

- [ ] **Step 5: Commit (only if user asked)**

---

### Task 4: Organism — `CheckoutView`, copy, mappers, `CheckoutCard`

**Files:**

- Create: `packages/ui/src/organisms/checkout/types.ts`
- Create: `packages/ui/src/organisms/checkout/copy.ts`
- Create: `packages/ui/src/organisms/checkout/view.ts`
- Create: `packages/ui/src/organisms/checkout/view.test.ts`
- Create: `packages/ui/src/organisms/checkout/CheckoutCard.tsx`
- Create: `packages/ui/src/organisms/checkout/CheckoutCard.test.tsx`
- Create: `packages/ui/src/organisms/checkout/index.ts`
- Modify: `packages/ui/package.json` (add `@repo/api-contracts`)
- Modify: `packages/ui/src/index.ts`

**Interfaces:**

- Consumes: atoms, molecules, `CheckoutSession`, `CHECKOUT_ERROR_CODE`, `formatCurrency`
- Produces:

```ts
export type CheckoutView =
  | { kind: 'loading' }
  | { kind: 'session'; session: CheckoutSession; notice: string | null }
  | { kind: 'price_changed'; session: CheckoutSession; newPriceCents?: number }
  | { kind: 'expired' }
  | { kind: 'unavailable' }
  | { kind: 'claimed_elsewhere' }
  | { kind: 'not_found' }
  | { kind: 'error'; message: string };

export function viewFromSession(session: CheckoutSession, notice?: string | null): CheckoutView;
export function viewFromErrorCode(code: string | null, session?: CheckoutSession): CheckoutView;

export function CheckoutCard(props: {
  view: CheckoutView;
  busy: boolean;
  onComplete: (session: CheckoutSession) => void;
  onConfirmPrice: (session: CheckoutSession) => void;
}): JSX.Element;
```

Copy: centralize ended/completed/failed/price-changed strings in `copy.ts`. Prefer mobile’s clearer wording where the two apps differ; keep distinct expired vs unavailable titles.

- [ ] **Step 1: Write failing view mapper tests**

```ts
import { CHECKOUT_ERROR_CODE } from '@repo/api-contracts';

import { viewFromErrorCode, viewFromSession } from './view';

const active = {
  id: 'sess_1',
  listingId: 'listing_1',
  status: 'active' as const,
  priceAtCreation: 4200,
  acknowledgedPrice: 4200,
  createdAt: '2026-01-01T00:00:00.000Z',
  expiresAt: '2026-01-01T00:10:00.000Z',
  failureReason: null,
};

describe('viewFromSession', () => {
  it.each([
    {
      name: 'session_lapsed',
      session: { ...active, status: 'expired' as const, expiryReason: 'session_lapsed' as const },
      kind: 'expired',
    },
    {
      name: 'hold_released',
      session: { ...active, status: 'expired' as const, expiryReason: 'hold_released' as const },
      kind: 'unavailable',
    },
  ])('maps $name', ({ session, kind }) => {
    expect(viewFromSession(session).kind).toBe(kind);
  });
});

describe('viewFromErrorCode', () => {
  it.each([
    { code: CHECKOUT_ERROR_CODE.TIMEOUT, kind: 'expired' },
    { code: CHECKOUT_ERROR_CODE.UNPROCESSABLE_CONTENT, kind: 'unavailable' },
    { code: CHECKOUT_ERROR_CODE.NOT_FOUND, kind: 'not_found' },
    { code: CHECKOUT_ERROR_CODE.CONFLICT, kind: 'claimed_elsewhere' },
  ])('maps $code to $kind', ({ code, kind }) => {
    expect(viewFromErrorCode(code).kind).toBe(kind);
  });

  it('maps PRECONDITION_FAILED to price_changed when session is present', () => {
    expect(viewFromErrorCode(CHECKOUT_ERROR_CODE.PRECONDITION_FAILED, active)).toEqual({
      kind: 'price_changed',
      session: active,
    });
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

Run: `pnpm --filter @repo/ui test -- view.test`

- [ ] **Step 3: Implement types, copy, view mappers**

Port logic from `apps/mobile-web/app/checkout/[id].tsx` (`viewFromSession` / `viewFromError`) into `view.ts`. Put user-facing strings in `copy.ts` and reference them from `CheckoutCard` only.

- [ ] **Step 4: Write CheckoutCard tests**

Cover at least:

1. `kind: 'session'` + active → shows price + “Complete purchase”
2. `kind: 'price_changed'` → confirm CTA
3. `kind: 'expired'` / `unavailable` → distinct titles
4. `session.status === 'failed'` → retry button
5. `kind: 'loading'` → spinner label

Use `testID`s: `complete-button`, `confirm-price-button`, `retry-button`, `acknowledged-price`, `price-notice`.

- [ ] **Step 5: Implement CheckoutCard**

Compose `Panel` / `PriceRow` / `Banner` / `Notice` / `Button` / `Spinner` / `ActionStack` / `Text`. Busy labels: “Completing…”, “Checking price…”, “Retrying…”.

- [ ] **Step 6: Run UI package tests — PASS**

Run: `pnpm --filter @repo/ui test`

- [ ] **Step 7: Commit (only if user asked)**

---

### Task 5: Wire Next.js for `react-native-web` + NativeWind + tokens

**Files:**

- Modify: `apps/web/package.json`
- Modify: `apps/web/next.config.js`
- Create: `apps/web/tailwind.config.js`
- Create: `apps/web/postcss.config.js`
- Create: `apps/web/app/globals.css`
- Modify: `apps/web/app/layout.tsx`
- Modify: `apps/mobile-web/tailwind.config.js` (preset → `@repo/tokens/preset`)

**Interfaces:**

- Consumes: `@repo/tokens/preset`, `cssVariables`, `@repo/ui`
- Produces: Web app can `import { CheckoutCard } from '@repo/ui'` and render RN components

- [ ] **Step 1: Add dependencies**

```bash
pnpm --filter web add @repo/ui @repo/tokens react-native-web nativewind react-native
pnpm --filter web add -D tailwindcss postcss autoprefixer
```

Pin `react-native` to the same major as mobile (`0.74.x`) and `react-native-web` compatible with RN 0.74 / React 18.

- [ ] **Step 2: Configure Next**

```js
// apps/web/next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  transpilePackages: [
    '@repo/ui',
    '@repo/tokens',
    '@repo/utils',
    '@repo/api-contracts',
    'react-native-web',
  ],
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      'react-native$': 'react-native-web',
    };
    config.resolve.extensions = [
      '.web.js',
      '.web.jsx',
      '.web.ts',
      '.web.tsx',
      ...config.resolve.extensions,
    ];
    return config;
  },
};

module.exports = nextConfig;
```

```js
// apps/web/tailwind.config.js
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', '../../packages/ui/src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset'), require('@repo/tokens/preset')],
};

// apps/web/postcss.config.js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

```css
/* apps/web/app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

In `layout.tsx`, import `./globals.css` and inject `cssVariables` from `@repo/tokens` via a `<style>` tag. Body uses CSS vars for surface/text.

- [ ] **Step 3: Point mobile Tailwind at tokens**

```js
presets: [require('nativewind/preset'), require('@repo/tokens/preset')],
```

Add `@repo/tokens` workspace dep to `apps/mobile-web` if missing.

- [ ] **Step 4: Smoke — typecheck web**

Run: `pnpm --filter web typecheck`

Expected: PASS (or only pre-existing errors). Copy `nativewind-env.d.ts` into `apps/web` if `className` types complain.

- [ ] **Step 5: Commit (only if user asked)**

---

### Task 6: Refactor `apps/web` checkout to `CheckoutCard`

**Files:**

- Modify: `apps/web/app/checkout/[id]/checkout-client.tsx`
- Modify: `apps/web/app/checkout/[id]/page.tsx`
- Modify: `apps/web/app/checkout/[id]/checkout-client.test.tsx`
- Modify: `apps/web/app/checkout/[id]/page.ssr.test.tsx` (only if selectors break)
- Modify: `apps/web` Jest config — `moduleNameMapper` for `react-native` → `react-native-web`

**Interfaces:**

- Consumes: `CheckoutCard`, `viewFromSession`, `viewFromErrorCode`, `CheckoutView`
- Produces: same user-visible behaviors as existing tests

- [ ] **Step 1: Wire Jest alias for RN-web**

Ensure tests resolve `react-native` to `react-native-web` the same way Next does.

- [ ] **Step 2: Rewrite `CheckoutClient`**

Replace inline styles with state held as `CheckoutView`, mutations via tRPC, render `<CheckoutCard ... />`. No client refetch on mount — initialize view from `initialSession` / `priceChangedTo`.

Use `formatCurrency` from `@repo/utils` for post-confirm notice strings.

- [ ] **Step 3: Restyle `page.tsx` shell with CSS vars**

Replace hardcoded `#5a5a60` with `var(--color-muted)`. Keep SSR `<dl>` as web-only shell (shared `CheckoutSummary` is optional — skip unless trivial).

- [ ] **Step 4: Run web tests**

```bash
pnpm --filter web test
pnpm --filter web typecheck
```

Expected: PASS

- [ ] **Step 5: Commit (only if user asked)**

---

### Task 7: Refactor `apps/mobile-web` checkout to `CheckoutCard`

**Files:**

- Modify: `apps/mobile-web/app/checkout/[id].tsx`
- Modify: `apps/mobile-web/app/__tests__/checkout.test.tsx`

**Interfaces:**

- Consumes: same `@repo/ui` organism APIs as Task 6
- Produces: existing unit behaviors via shared `testID`s

- [ ] **Step 1: Replace local Panel / renderView with CheckoutCard**

Keep resume effect, `requestRef` / `mountedRef`, surface `'mobile'`. Map errors with `viewFromErrorCode`. Delete local `Panel`, `renderView`, `renderSession`, and local `CheckoutView` type.

- [ ] **Step 2: Align tests with shared copy**

Update string matchers if titles change; prefer `testID` queries (`complete-button`, etc.).

- [ ] **Step 3: Run mobile-web tests**

```bash
pnpm --filter mobile-web test
pnpm --filter mobile-web typecheck
```

Expected: PASS

- [ ] **Step 4: Commit (only if user asked)**

---

### Task 8: Docs cleanup + screenshots into `mocks/`

**Files:**

- Modify: `FUTURE-IMPROVEMENTS.md`
- Modify: `docs/decisions.md` (note under decision 8 or new decision)
- Create: `mocks/web-checkout-active.png`
- Create: `mocks/mobile-checkout-active.png`
- Create: `docs/session_2026-07-28_<HHMM>_shared-ui-tokens.md`

- [ ] **Step 1: Update FUTURE-IMPROVEMENTS item 1**

Mark literal component sharing as done via `@repo/ui` + `@repo/tokens` + RN-web; leave Storybook / Solito as out of scope.

- [ ] **Step 2: Start API + web + mobile-web**

```bash
pnpm dev:api
pnpm dev:web
pnpm dev:mobile-web
```

Create a session using the repo’s documented create-checkout curl (match actual tRPC HTTP shape from README).

- [ ] **Step 3: Capture web screenshot**

Open `http://localhost:3001/checkout/<sessionId>`. Save `mocks/web-checkout-active.png` (desktop viewport ~1280×800).

- [ ] **Step 4: Capture mobile screenshot**

Expo web phone viewport (390×844) or iOS Simulator. Save `mocks/mobile-checkout-active.png`.

- [ ] **Step 5: Session export**

Write `docs/session_2026-07-28_<HHMM>_shared-ui-tokens.md` per AGENTS.md.

- [ ] **Step 6: Final verification**

```bash
pnpm --filter @repo/tokens test
pnpm --filter @repo/ui test
pnpm --filter web test
pnpm --filter mobile-web test
```

Expected: all PASS; `mocks/` contains both PNGs.

- [ ] **Step 7: Commit (only if user asked)**

---

## Spec coverage self-check

| Spec requirement                              | Task               |
| --------------------------------------------- | ------------------ |
| `@repo/tokens` package + preset + CSS vars    | 1                  |
| `@repo/config/tailwind` re-exports tokens     | 1                  |
| Atoms (Text, Button, Banner, Notice, Spinner) | 2                  |
| Molecules (Panel, PriceRow, ActionStack)      | 3                  |
| CheckoutView + copy + CheckoutCard            | 4                  |
| Next RN-web + NativeWind + globals            | 5                  |
| Web checkout uses shared UI; SSR preserved    | 6                  |
| Mobile checkout uses shared UI                | 7                  |
| Screenshots in `mocks/`                       | 8                  |
| FUTURE-IMPROVEMENTS / decisions update        | 8                  |
| No dual platform implementations              | Global + Tasks 2–4 |
| No tRPC in UI                                 | Task 4             |

## Placeholder scan

No TBD/TODO left in task steps. `preset.js` may duplicate hex literals (explicit sync comment) — intentional CJS constraint.

## Type consistency

`CheckoutView`, `viewFromSession`, `viewFromErrorCode`, and `CheckoutCard` props are defined in Task 4 and consumed unchanged in Tasks 6–7.
