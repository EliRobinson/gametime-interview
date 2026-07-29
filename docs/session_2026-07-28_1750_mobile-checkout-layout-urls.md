# Session: Mobile checkout layout + share URL cleanup

**Date/time:** 2026-07-28 17:50  
**Focus:** Align mobile checkout with `mocks/references/gametime-mobile-checkout.png`; explain/remove raw URLs on mobile + web

## Summary

Fixed mobile checkout visual regression after the visual-shell pass: sticky footer was bloated with Share + raw resume URLs and visually crushed the price row. Removed on-screen share URLs on both surfaces; Share now only copies/shares via the platform APIs. Restacked mobile chrome to match the design doc (scroll stack + slim sticky urgency/terms/CTA).

## What the bottom URLs were

Not debug leftovers in the sense of accidental `console.log` — they were intentional Text nodes in `ShareTickets` rendering `shareWebUrl` / `shareMobileUrl`:

- `http://localhost:3001/checkout/<sessionId>` — web resume link
- `mobileweb://checkout/<sessionId>` — app deep link

Those strings are still what Share/clipboard sends; they just must not appear as plain text in the UI.

## Visual diff (Current vs Mock) — triage

| #      | Label                                              | Severity | Approach                                              |
| ------ | -------------------------------------------------- | -------- | ----------------------------------------------------- |
| DIFF-1 | Raw share URLs visible                             | Critical | Implement mock exactly — remove from UI               |
| DIFF-2 | Sticky footer overlaps price / eats viewport       | Critical | Slim sticky to urgency + terms + CTA; Share in scroll |
| DIFF-3 | Ticket Delivery layout (label/email/chevron)       | High     | Match mock stacked row                                |
| DIFF-4 | Super Deal / protection not visible in first paint | High     | Follows from DIFF-2 + polish banners                  |
| DIFF-5 | Show details link color                            | Medium   | Use `colors.link`                                     |
| DIFF-6 | Payment / Apple Pay row                            | —        | Skip — intentional per visual-shell design            |
| DIFF-7 | Artist photo vs stadium map thumb                  | —        | Skip — design chose stadium schematic                 |

## What changed

- Extracted `ShareTickets.tsx`; no longer renders URL text
- `CheckoutCard` gained `showShare` so mobile sticky can keep CTA-only
- Mobile: Share lives in ScrollView above sticky; sticky = urgency + terms + CTA
- Polish: Ticket Delivery row, Super Deal green treatment, Ticket Protection, link-styled terms / Show details
- Tests updated (ui / mobile-web / web) to assert URLs are **not** on screen

## Decisions / tradeoffs

- Kept CONTINUE CTA (not Apple Pay) and stadium map thumb — locked in `docs/2026-07-28-checkout-visual-shell-design.md`
- Share remains a continuity feature; placement is secondary in the scroll stack, not in the sticky bar
