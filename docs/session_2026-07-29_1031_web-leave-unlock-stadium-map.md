# Session — Web leave unlock + stadium map image

**Date:** 2026-07-29 10:31  
**Slug:** `web-leave-unlock-stadium-map`

## Summary

On web checkout, leaving via browser Back or the Gametime logo now confirms and releases the inventory hold. Replaced the CSS stadium schematic with Gametime’s CenturyLink Field map image, sized via the CDN `width` query param.

## Leave / unlock

Active holds (`created` / `active` / `failed`, same as shareable sessions) install a leave guard in `CheckoutClient`:

- Prompt: “Leaving this page will remove the lock on the ticket”
- Confirm → `checkout.release` (best-effort) → navigate
- Cancel → stay; hold unchanged
- Completed sessions: no prompt, no release
- Browser Back uses a history sentinel + `popstate` (skips duplicate push under Strict Mode remount)
- In-app links leaving the checkout path are intercepted in capture phase (covers the header logo)
- `beforeunload` still warns on tab close/refresh

## Stadium map

- Shared helper `stadiumMapImage.util.ts`: builds `maps.gametime.co/.../edsheeran-8.png?width=N&auto=webp`
- Web order summary: `<img>` with `srcSet` (480 / 768 / 1280) and `sizes` for mild responsiveness
- Mobile `CheckoutStadiumMap`: RN `Image` with configurable encode width (default 768)
- Section bubble still overlays the photo

## Tests

- Web client: confirm logo leave, cancel stay, release failure still navigates, back confirm, completed skips guard
- SSR: map CDN URL present in HTML
- Util: width URL + srcSet descriptors
