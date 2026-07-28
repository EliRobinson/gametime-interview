# Decisions: Production Shortcuts Taken for This POC

This document tracks every place we deliberately chose the faster/simpler option over the
more production-ready one, and why. It's a companion to [`CONTEXT.md`](../CONTEXT.md) (which
holds the domain vocabulary) and the
[implementation plan](superpowers/plans/2026-07-27-checkout-continuity.md) (which holds the
task-by-task build). Nothing here should surprise a reviewer reading the code — each entry
says what a real production build would do instead, and what it would cost to get there.

## 1. In-memory session store instead of Prisma/Postgres

**What we did:** `InMemorySessionStore` — a plain `Map` living in the API process, behind a
`SessionStore` interface.

**Why:** The prompt explicitly allows in-memory storage ("In-memory storage is fine"), and
the repo already has Prisma + Postgres wired for a different model (`User`). Adding a
`CheckoutSession` migration would cost real setup time — and require the interviewer to have
Postgres running — for a decision the prompt says doesn't matter.

**Production cost of deferring this:** Sessions vanish on process restart, don't survive a
multi-instance deployment (a second API replica has no idea the session exists), and the
atomic compare-and-swap concurrency control (see #2) only works because the store is a
single in-process object — it does not generalize to multiple API instances without a real
transactional store.

**What we'd do instead:** A `CheckoutSession` Prisma model, with the CAS logic reimplemented
as a conditional `UPDATE ... WHERE status = $expected` (or a `SELECT ... FOR UPDATE`
transaction) so the same-status-guard semantics hold across processes.

## 2. Atomic in-memory CAS instead of a distributed lock

**What we did:** `SessionStore.casUpdate(id, expectedStatus, updater)` — checks and writes
in the same synchronous call, with no `await` in between, so two same-tick `completeSession`
calls can't both win.

**Why:** Correct and sufficient for a single-process prototype, and it's the simplest thing
that actually demonstrates the duplicate-order-prevention requirement the prompt calls out
by name.

**Production cost of deferring this:** This guarantee is a property of JavaScript's
single-threaded event loop plus single-process storage — it silently stops being true the
moment the API is horizontally scaled. A second replica handling device B's `complete` call
would have its own copy of the session (if backed by another in-memory store) or would race
a real database without the transaction boundary.

**What we'd do instead:** Move the guard into the database (see #1) as a single conditional
write, or use a real distributed lock (e.g. a Postgres advisory lock or a Redis `SETNX`) if
sessions must stay purely in-memory for latency reasons.

## 3. Deterministic fakes instead of real Payment/Inventory integrations

**What we did:** `FakePaymentProvider` / `FakeInventoryProvider` with forceable outcomes
(`forceOutcome`, `setPrice`, `releaseListing`) instead of any real provider SDK.

**Why:** The prompt explicitly says not to integrate real payment/auth/inventory systems,
and to stub them "behind clear interfaces" — which is exactly what `PaymentProvider` /
`InventoryProvider` are. Determinism (vs. randomized outcomes) was a deliberate choice so
both the automated tests and a live demo can reproduce a decline or a sold-out listing
on command, rather than hoping for one.

**Production cost of deferring this:** None of the actual failure semantics of Stripe (or
similar) are modeled — no idempotency keys on the payment side, no webhook-driven
confirmation, no partial captures, no real inventory reservation TTL tuning.

**What we'd do instead:** Swap `PaymentProvider`/`InventoryProvider` implementations behind
the same interface for a real payment provider and a real inventory service, keeping
`CheckoutService`'s state machine untouched — that's the point of stubbing behind an
interface in the first place.

## 4. Structured event log instead of a real analytics pipeline

**What we did:** `EventLog` — an in-process array of typed events
(`session_created`, `session_resumed`, `price_reconfirmed`, `session_expired`,
`session_completed`, `session_failed`), each carrying `sessionId`/`timestamp`/`surface`.

**Why:** Demonstrates the actual event taxonomy and instrumentation judgment the prompt
asks about ("How would you instrument this flow to know whether continuity improves
checkout conversion?") without spending prototype time standing up a real analytics
pipeline (Segment/Amplitude/Snowplow) that no reviewer could inspect anyway.

**Production cost of deferring this:** Events are lost on process restart and never leave
the API process — there's no funnel, no dashboard, no actual conversion measurement.

**What we'd do instead:** Emit the same event shapes to a real event pipeline; the funnel
we'd build is resume-to-completion rate segmented by single-surface vs. cross-surface
sessions, and time-to-complete after a price reconfirmation vs. without one.

## 5. Polling on resume instead of push updates

**What we did:** Both `apps/web` and `apps/mobile-web` fetch session state once, on load /
resume — no live updates while a fan sits on the checkout screen.

**Why:** Simplest thing that satisfies "how do web and mobile know whether a session is
still valid" — check at the moment that matters (resume, complete) rather than continuously.

**Production cost of deferring this:** A fan sitting on an active session won't see a price
change or an inventory expiration happen live — they'd only find out when they try to
complete, or if they navigate away and back. For a time-sensitive purchase this is a real
gap during a fast-moving on-sale.

**What we'd do instead:** Server-Sent Events or a WebSocket channel per session, pushing
`price_reconfirmed`/`session_expired`-equivalent state changes to whichever surface is
currently open, so the UI updates without the fan having to act first.

## 6. Hardcoded session TTL instead of a per-listing/configurable expiry

**What we did:** `SESSION_TTL_MS = 10 * 60 * 1000` — one constant for every session,
regardless of listing, event proximity, or inventory pressure.

**Why:** One clock is easier to reason about and test than a rule that varies by context,
and the prompt doesn't ask for tuned expiry behavior — just that expiration exists and is
handled.

**Production cost of deferring this:** A checkout session for a ticket to an event starting
in 20 minutes probably shouldn't get the same 10-minute grace window as one for an event
next month; high-demand on-sales might want a shorter window to recycle inventory faster.

**What we'd do instead:** Make TTL a function of listing metadata (event start time,
demand signal) rather than a global constant, decided by whoever owns inventory policy.

## 7. No fan authentication on session resume

**What we did:** The session ID itself is the sole resume credential — no login required
(see [`CONTEXT.md`](../CONTEXT.md#checkout-session)).

**Why:** This is a deliberate domain decision, not just a shortcut — it's required by the
prompt's own scenario ("send the event to a friend, then complete checkout on desktop").
Adding auth would directly break that flow.

**Production cost of deferring this:** Anyone who intercepts the link/deep link can view
(and complete) someone else's in-progress checkout — acceptable for a low-value share link
in a prototype, not acceptable if the session ever carries a saved payment method or
personal data beyond the listing itself.

**What we'd do instead:** Keep resume capability-based (no login) but scope what a resumed
session can see/do based on whether the resuming client also presents the original fan's
auth token — full checkout details and payment only for the owner, a read-only "someone
sent you this" preview for anyone else holding just the link.

## 8. Two independent frontend apps (`apps/web` new Next.js, `apps/mobile-web` existing Expo) instead of one

**What we did:** Stood up a brand-new minimal Next.js app for the web checkout surface
rather than trying to add SSR to the existing Expo Router (React Native Web) app.

**Why:** Expo Router's web target is client-rendered by default; the prompt specifically
asks for "web performance judgment around what appears before hydration," which isn't
demonstrable without real SSR. The repo's own README already documents this exact swap as
a supported path ("the web target for a Next.js app without touching shared code").

**Production cost of deferring this:** Two separate web-ish surfaces now exist in one repo
(`apps/mobile-web`'s web build, and `apps/web`) with no shared UI layer between them for the
checkout flow specifically — real duplication risk if the checkout UI needs to evolve in
both places.

**What we'd do instead:** If this became the permanent web strategy, retire
`apps/mobile-web`'s web target entirely and consolidate on `apps/web` (Next.js) for all web
traffic, sharing `packages/ui`/`packages/api-contracts` the same way both surfaces already
do in the prototype.

**Update (shared UI landed):** the duplication risk called out above is now mitigated for the
checkout flow. `@repo/tokens` is the single source for colors/spacing/typography (Tailwind
preset + CSS vars); `@repo/ui` holds atoms (`Text`, `Button`, `Banner`, `Notice`, `Spinner`),
molecules (`Panel`, `PriceRow`, `ActionStack`), and the `CheckoutCard` organism with
`viewFromSession`/`viewFromErrorCode` mappers. `apps/web` adopted react-native-web +
NativeWind alongside Next.js SSR so it renders the same `@repo/ui` components as
`apps/mobile-web` — no parallel DOM checkout implementation. Storybook and Solito were
deliberately left out of scope.

## 9. No live cross-surface E2E test

**What we did:** Unit/integration tests on the state machine, the tRPC router, and each
client's rendering logic — no automated test that actually spins up the API, a browser, and
a mobile client together and drives a real create-on-one/resume-on-the-other flow.

**Why:** The sandbox this was built in blocks localhost networking between separately
launched processes, so a real cross-process E2E wasn't runnable here even if written. The
closest thing we have is a `renderToStaticMarkup` test proving the pre-hydration HTML is
present, plus manual verification steps in the plan (`curl`/JS-disabled browser check for
web, `xcrun simctl openurl` for the mobile deep link).

**Production cost of deferring this:** The one thing genuinely unverified end-to-end is a
real device-to-device handoff — everything upstream of it is tested, but the handoff itself
is only exercised by hand.

**What we'd do instead:** A Playwright test that creates a session via the API, resumes it
against the running Next.js app, and a Maestro flow that opens the same session via the iOS
Simulator deep link — both already scaffolded in this repo's tooling (`test:e2e:web`,
`test:e2e:mobile`), just not wired to this feature yet.

## 10. One shared `SESSION_TTL_MS` constant is also where a real duplicate-charge bug hid

**What we did during the build:** the first pass at `CheckoutService.completeSession`
allowed a second `complete` call to pass the compare-and-swap while the session was already
`pending_payment`, because the guard compared against whatever status the _caller_ observed
rather than rejecting `pending_payment` outright — the exact race `CONTEXT.md` names as the
duplicate-order hazard, and the one the plan's own concurrency test didn't catch (both of
its simulated calls read `active` first, not one reading `active` and one reading
`pending_payment`). Caught in final review with a live probe, not by inspection, and fixed
before merge with an explicit rejection plus a test asserting the payment provider is never
double-charged.

**Why flag a bug as a "decision":** it's a reminder that the CAS guard's correctness is a
property of exactly which states it's willing to transition _from_, not just that it's
atomic — worth double-checking again if this logic is ever touched.

## 11. Sessions now carry an explicit `expiryReason`

**What we did:** added a field (`'session_lapsed' | 'hold_released'`, nullable) alongside
`status`, so a
resumed session can tell a fan _why_ it's `expired` — the session's own clock ran out, or
the independent inventory hold was released — matching the distinction `CONTEXT.md` draws
between Session Expiration and Inventory Hold. The original plan only surfaced this
distinction on the completion path, not on resume, which the mobile client's five-state
requirement exposed as a gap.

**Production cost of leaving it out:** without it, "your session expired" and "someone else
got the tickets" render as the same generic message, which is a real difference in what the
fan should do next (nothing, vs. go find another listing).

## 12. `apps/web` skips Next's bundled ESLint step during build — verified, not assumed

**What we did:** `next.config.js` sets `eslint: { ignoreDuringBuilds: true }`, so `next build`
never runs its own lint pass. Lint still runs as `apps/web`'s own `lint` script
(`eslint . --max-warnings=0` against the repo's shared flat config), which is invoked by
`pnpm lint` at the root (via Turborepo) and by CI's `Lint` step in
`.github/workflows/ci.yml` — so no lint coverage is actually lost, it just runs as its own
task instead of inside the Next build.

**Why this isn't a shortcut we should reverse:** we tested it directly rather than assuming.
Removing the flag and deliberately introducing an unused-variable violation (a rule the
shared config already enforces) still produced a clean `next build` — Next 14.2.35's
bundled ESLint integration doesn't reliably read this repo's flat `eslint.config.mjs`, so
enabling it wouldn't add real enforcement, only a slower, silently-inert build step.

**What "actually wiring it" would require:** not a config tweak — flat-config support in
Next's built-in linter isn't dependable until Next 15, which brings its own surface area
(React 19 baseline, App Router behavior changes) that's out of scope for this prototype.
If in-build linting is ever wanted, that's the real fix, tracked as its own upgrade, not a
one-line change here.

## 13. No one-tap "confirm new price and buy" — verified, not a missing feature

**What we did:** price reconfirmation (`confirmPrice`) and completion (`complete`) stay two
distinct calls/taps on both `apps/web` and `apps/mobile-web`, exactly matching the "Block
completion, require explicit re-confirmation" decision made during design. There is no
single button that both acknowledges a new price and charges it.

**Why this isn't a gap:** merging them would mean the fan authorizing a charge for a number
`PriceChangedError` doesn't actually carry — the error only signals _that_ the price
changed, not the new value, so a client can't legitimately skip the round trip that fetches
it. Building a one-tap version would require changing the API contract (returning the new
price on `PriceChangedError`, or on the `complete` response before rejecting), which is a
deliberate scope decision, not a bug fix.

**What we'd do instead, if one-tap became a real requirement:** have `PriceChangedError`
carry the current price, and let the client render "confirm $X and complete" as a single
action that calls `confirmPrice` then `complete` in sequence — still two API calls, but one
fan-facing tap.
