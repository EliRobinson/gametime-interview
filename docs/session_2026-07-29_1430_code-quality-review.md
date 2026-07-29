# Session: Full-app code quality review

**Date/time:** 2026-07-29 ~14:30 PT  
**Slug:** `code-quality-review`

## Summary

Ran a thermo-nuclear code quality review of the entire Checkout Continuity app (not a PR diff). Verdict: **do not rubber-stamp on structure**. Domain/contracts/view-model layers are strong; the main debt is duplicated web↔mobile checkout orchestration and a client-side demo price-change path that duplicates inventory authority. Produced an interactive findings canvas beside chat.

## Key findings (priority)

1. **Blocker — dual orchestration:** `apps/web/.../checkout-client.tsx` and `apps/mobile-web/app/checkout/[id].tsx` both reimplement `sessionFromView`, demo price-bump timer, complete/confirmPrice busy+optimistic processing flow. Code judo: one shared mutation/orchestration module; platform chrome stays local.
2. **Blocker — dual price authority:** Server `FakeInventoryProvider.heldPrice` is authoritative; both clients also hardcode `DEMO_PRICE_CHANGE` timers. Web has `priceChangedTo` but `page.tsx` never passes it after SSR resume. Code judo: resume returns live hold price; `viewFromSession` maps `price_changed`; delete client timers as source of truth.
3. **Major — chrome fork:** Shared `@repo/ui` chrome (`GuaranteePanel`, `ContactRow`, `CheckoutTerms`) exists, but web reinvents guarantee/terms/contact with DOM + `OrderSummary`. `decisions.md` claims shared UI closed the duplication risk; presentation stack is still forked.
4. **Major — policy re-encoding:** `isShareableSession`, web `isDecorativeStatus`, mobile `showStickyActions`, presentation `TERMINAL_KINDS`, plus dead `created` status in the schema (create always sets `active`).
5. **Major — catalog split-brain:** `DEMO_LISTINGS` in API context vs `LISTING_FIXTURES` in UI — ids aligned by convention only.
6. **Minor:** Unused `TicketProtectionCard`; unused-by-web `GuaranteePanel`; `as CheckoutSession` casts after nullable CAS.

## Strengths called out

- `CheckoutService` owns the machine; CAS + explicit `pending_payment` reject.
- `CheckoutView` + mappers keep `CheckoutCard` free of domain status switches.
- No files near 1k LOC; complexity is behavioral not sprawl.
- POC shortcuts documented in `docs/decisions.md`.

## Artifacts

- Canvas: `canvases/code-quality-review.canvas.tsx` (workspace canvases dir)
- No code changes in the app repo from this review.
