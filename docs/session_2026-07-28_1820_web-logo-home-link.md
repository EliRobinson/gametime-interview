# Session: Web logo → home link

**Date:** 2026-07-28 ~18:20 PT

## Summary

Made the Gametime wordmark in the web app root header link to `/` so users can exit deeply linked routes (e.g. checkout) back to the main page.

## Changes

- `apps/web/app/layout.tsx`: Wrapped the header “Gametime ›” mark in a Next.js `Link` to `/`, with `aria-label="Gametime home"` and inherited header color / no underline.
