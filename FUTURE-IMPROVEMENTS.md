# Future Improvements

1. ~~Shared components between `apps/web` and `apps/mobile-web`~~ — partially addressed: price
   formatting (`formatCents`/`formatPrice`) was deduped into `packages/utils`'s `formatCurrency`,
   and the tRPC error-code handling both checkout screens reimplemented is now a shared
   `CHECKOUT_ERROR_CODE` constant in `packages/api-contracts`. Literal component sharing is still
   open: `apps/web` renders plain DOM/inline styles and `apps/mobile-web` renders React
   Native/NativeWind, so `packages/ui`'s `Button` can't render on web as-is. Adopting
   react-native-web in `apps/web` would close that gap but is a larger, riskier change (bundler
   config, CSS/Tailwind vs NativeWind interop, SSR/hydration) that deserves its own scoped pass
   rather than folding into a dedup task.
2. ~~Const enums for session/status states, shared between the mobile and web codebases instead
   of each maintaining its own copy.~~ Done — `CheckoutSessionStatus` was already shared via
   `packages/api-contracts`; the actual duplication (`Surface` type in
   `apps/api/src/domain/events.ts`, and ad-hoc tRPC error-code string literals in both checkout
   screens) has been consolidated into `@repo/api-contracts`.
