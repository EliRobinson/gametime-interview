# Session: Remove listing urgency bar

**Date:** 2026-07-28 ~18:23 PDT

## Summary

Removed the pale yellow “urgency” strip from the selection `ListingDetail` dock. It was meant to show scarcity copy (“Only a few tickets left at this price!”) but used theme body text (white in dark mode) on a hardcoded light yellow background, so it looked like an empty bar.

## Decision

Treat the broken selection-sheet urgency UI as noise and remove it. Checkout still has its own working urgency presentation (`UrgencyBanner` / order summary) driven by `urgencyTicketsLeft` fixtures; that data field stays on the listing view model.

## Changes

- `ListingDetail.tsx` — drop the urgency strip block
- `listings.copy.ts` — remove unused `urgency` string
