# Session: Code quality fixes (full-app)

**Date/time:** 2026-07-29 ~14:45 PT  
**Slug:** `code-quality-fixes`

## Summary

Implemented all six findings from the thermo-nuclear code quality review. No commit/push yet — waiting on manual flow testing.

## Decisions (best judgment)

| Finding            | Choice                                                                                                                                                    |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1 orchestration   | Shared `useCheckoutActions` + `checkout.policy.util` in `@repo/ui`; platform leave-guards / sticky chrome stay in apps                                    |
| F2 price authority | `resume` returns `{ session, livePriceCents }`; `viewFromResume` maps divergence; countdown `onExpire` re-resumes (no client `DEMO_PRICE_CHANGE` setView) |
| F3 chrome          | Wire `GuaranteePanel` / `ContactRow` / `CheckoutTerms` on web via RN-web; keep DOM `OrderSummary` for SSR first paint                                     |
| F4 status          | Drop unused `created` status; centralize shareable / decorative / actions predicates                                                                      |
| F5 catalog         | `DEMO_CATALOG` + `DEMO_EVENT` in `@repo/api-contracts`; API seeds + UI fixtures both derive from it                                                       |
| F6 cleanup         | Delete unused `TicketProtectionCard`; `mustCasUpdate` replaces nullable CAS casts; router `withDomainErrors` helper                                       |

## Key files

- `packages/api-contracts/src/demo-catalog.ts`, `schemas/checkout.ts` (`resumeSessionResultSchema`)
- `apps/api/src/domain/checkout-service.ts`, `routers/checkout.ts`, `context.ts`
- `packages/ui/.../useCheckoutActions.ts`, `checkout.policy.util.ts`, `mapCheckoutView.util.ts` (`viewFromResume`)
- `apps/web/.../checkout-client.tsx`, `resume-session.ts`, `page.tsx`
- `apps/mobile-web/app/checkout/[id].tsx`

## Verification

All package/app Jest suites + typechecks passed (`api-contracts`, `ui`, `api`, `web`, `mobile-web`).

## Manual test checklist (for you)

1. Selection → create checkout on web; SSR shows price/status without flash
2. Complete purchase on web
3. Create on web → resume on mobile (share / deep link)
4. Demo listing (`listing_3`): wait ~10s → price-change UI after resume refresh → confirm → buy
5. Leave/back on web and mobile releases hold; listing selectable again
6. Concurrent complete race still shows “Finishing on another device”
