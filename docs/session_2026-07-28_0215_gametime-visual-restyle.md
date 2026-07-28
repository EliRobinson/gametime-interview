# Session: Gametime visual restyle (2026-07-28 ~0215)

## Summary

Restyled shared checkout UI to match real Gametime production screenshots
(web checkout + mobile dark review / loading). Tokens, atoms, and app shells updated;
mocks refreshed; Gametime reference PNGs stored under `mocks/references/`.

## Visual decisions

- **Brand accent:** mint `#00D692` (logo chevron, deal banners, mobile CTA)
- **Web:** light canvas `#F5F5F5`, black header + black pill `CONTINUE`, Super Deal mint callout
- **Mobile:** `.dark` root → black canvas, white type, mint pill CTA; loading uses title +
  “So you don't have to.” + skeleton cards (from ticket-loading screen)
- **Web `darkMode: 'class'`** so OS dark mode does not flip web CTAs to mint

## Out of scope

Ticket selection / stadium map screens (refs only). Full payment method UI from web checkout mock.
