# Future Improvements

1. ~~Shared components between `apps/web` and `apps/mobile-web`~~ — Done. Price formatting and
   tRPC error-code handling were deduped earlier (`formatCurrency` in `packages/utils`,
   `CHECKOUT_ERROR_CODE` in `packages/api-contracts`). Literal component sharing is now closed
   via `@repo/tokens` (shared design tokens + Tailwind preset + CSS vars),
   `@repo/ui` (atomic-design atoms/molecules plus `CheckoutCard`/`CheckoutView`), and
   react-native-web in `apps/web` so both surfaces render the same RN primitives. Storybook for
   isolated component docs and Solito for shared navigation remain out of scope for this POC.
2. ~~Const enums for session/status states, shared between the mobile and web codebases instead
   of each maintaining its own copy.~~ Done — `CheckoutSessionStatus` was already shared via
   `packages/api-contracts`; the actual duplication (`Surface` type in
   `apps/api/src/domain/events.ts`, and ad-hoc tRPC error-code string literals in both checkout
   screens) has been consolidated into `@repo/api-contracts`.
