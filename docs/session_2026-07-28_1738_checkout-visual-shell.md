# Session: Checkout visual shell implementation

**Date/time:** 2026-07-28 17:38  
**Branch:** `feat/ticket-landing-share` (PR #5)  
**Focus:** Implement `docs/2026-07-28-checkout-visual-shell-design.md`

## Summary

Restyled web and mobile checkout to match Gametime mocks (visual shell only — no real payment methods). Shared presentation blocks live in `@repo/ui` `features/checkout`; each app owns page chrome. Continuity behavior (resume, complete, confirm price, share, conflict/expiry) unchanged.

## Decisions / tradeoffs

- **Hybrid architecture:** shared EventSummary / PriceBreakdown / SuperDeal / Urgency / Guarantee / TicketProtection / stadium map; web SSR DOM order summary stays no-JS for price; mobile RN composition with light theme + sticky footer.
- **Price semantics:** `acknowledgedPrice` is listing total — line item and Total both use `formatCurrency(acknowledgedPrice)`; optional “· N seats” note; no unit × qty double-counting.
- **CTA copy:** kept CONTINUE / confirm / retry (not “Buy with G Pay”).
- **Tokens:** added guarantee purple, stadium palette, and link blue once in `@repo/tokens`; ListingsMap switched to those tokens (no feature hex).
- **CheckoutCard slimmed:** ready state is notice + CTA + share only (no resume hero / PriceRow); shells own price display.
- **Missing fixtures:** degrade (listing id, omit map/Super Deal) rather than crash.

## What shipped

- Shared: `mapCheckoutPresentation.util`, presentation components, expanded `checkout.copy` / view-model
- Web: two-column shell, fixture-driven SSR summary + map, contact / terms / guarantee
- Mobile: light stacked shell, show-details price toggle, sticky urgency + terms + CTA
- Tests updated for new structure; tokens/UI/web/mobile checkout suites green

## Follow-up (same session)

**Bug:** SSR `page.tsx` / `order-summary.tsx` imported from `@repo/ui` barrel → pulled `SelectionScreen` (`useState`) into a Server Component → Next 500.

**Fix:** `@repo/ui/server` entry exporting only pure copy/fixtures/mappers; SSR imports that path. Jest maps the subpath for ts-jest.
