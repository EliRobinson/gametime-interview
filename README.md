# Notes about the demo

- Cross-surface resume in this demo is **web ↔ web** (copy the link into another
  tab/browser) and **mobile → web** (native share/copy hands the fan a web
  checkout URL). I did not build a seamless **web → mobile** handoff: a browser
  cannot detect whether an iOS/Android simulator (or Expo) is running on the
  reviewer’s machine, and custom-scheme deep links (`mobileweb://…`) only work
  when that OS has registered the scheme. An earlier **Open in app** control on
  web (navigate / `window.open` to `mobileweb://…`) proved too volatile — it
  either navigated the checkout page away or failed silently depending on the
  browser and whether Expo had claimed the scheme — so it was removed. Use
  `xcrun simctl openurl` (below) for local deep-link demos instead.
- I also wanted to pressure-test a quickly built React Native demo alongside
  shared UI and a monorepo with multiple apps. This started from a GitHub
  template I maintain, with a decent amount of cleanup so the shared packages
  actually show code reuse between the React Native app and the web app.
- The core sharing/resume design came together quickly; I spent extra time on
  presentation so the demo feels attractive and demonstrates mobile ↔ web
  parity, not just a working handoff.
- **Why go past a “minimal UI” slice?** The prompt’s time box (~2–3 hours)
  prefers a focused end-to-end continuity path over a broad checkout clone. I
  still invested past that floor on purpose: a bare curl-and-JSON demo proves
  the state machine, but a product-shaped shell (selection → checkout, shared
  tokens/UI, Gametime-like visual hierarchy) is a better signal of how I attack
  _complicated_ product + systems problems — domain boundaries, cross-surface
  consistency, and reviewer-friendly UX — not only whether `resume` returns
  `200`. Treat the polish as intentional flex, not scope creep that replaced the
  continuity core.

**Time trade-offs (kept the continuity slice honest, deferred production depth):**

- In-memory session store and deterministic payment/inventory fakes — fine per
  the prompt, zero reviewer setup, and the CAS race is still real in one
  process. No Prisma session model, no real Stripe/inventory SDKs, no auth.
- Surfaces discover changes by acting (resume / complete), not via push — with
  one demo exception: **Sec 118 · Row 8 · 10s price demo** (`listing_3`) ages its _held_
  price after 10 seconds so you can watch reconfirmation live. Catalog price
  stays at the seed if you leave and browse again; a new session resets the
  timer. Other failure modes (decline, sold-out) still need tests /
  `forceOutcome` / `releaseListing`.
- No automated create-on-web / complete-on-mobile E2E; unit tests cover the
  state machine and conflict path, and the handoff is verified by hand.
- Fixed 10-minute session TTL, two-tap price confirm then buy (not one-tap),
  and share via opaque session id only — deliberate scope cuts, not unfinished
  stubs.

**Beyond the basic ask (to raise demo quality):**

- Ticket landing with listing selection and a static stadium map so the flow
  starts like a product, not a bare “create session” curl.
- Shared design tokens + `@repo/ui` checkout/listings so web (Next SSR) and
  native actually share components — not two parallel UIs with the same API.
- Visual shell aligned to Gametime-style mocks (layout, hierarchy, share UX)
  while keeping payment/promo chrome decorative and non-functional.
- Domain write-up (`CONTEXT.md`), decision log (`docs/decisions.md`), and
  structured instrumentation so the _why_ of the state machine is reviewable.

**AI-assisted engineering trail:** session notes under [`docs/`](./docs/)
(`session_<date>_<time>_<slug>.md`) record planning, trade-offs, and
implementation passes with AI. They are meant to show how I use assisted
engineering to move a product forward quickly and refine existing work — not
as a substitute for the code or the domain docs above.

---

# RN + Web Template

One codebase that ships to iOS, Android, and web, backed by a fully
type-safe API. Use this as a GitHub template for new projects.

---

# Checkout Continuity

A fan starts checking out on one surface and finishes on another — typically
**web → web** (same link in another tab) or **mobile → web** (share the web
checkout URL). The checkout session is owned by the server; each surface is just
a view onto it. Native deep links still work for local demos
(`mobileweb://checkout/<id>`), but share/copy intentionally hands out the web
URL so resume does not depend on the app already being installed.

## What was built

| Piece                                 | Where                                                 |
| ------------------------------------- | ----------------------------------------------------- |
| Session schemas (the shared contract) | `packages/api-contracts/src/schemas/checkout.ts`      |
| `CheckoutService` state machine       | `apps/api/src/domain/checkout-service.ts`             |
| In-memory session store (CAS)         | `apps/api/src/domain/session-store.ts`                |
| Stubbed inventory + payment           | `apps/api/src/domain/{inventory,payment}-provider.ts` |
| Structured event log                  | `apps/api/src/domain/events.ts`                       |
| tRPC surface                          | `apps/api/src/routers/checkout.ts`                    |
| Web checkout (SSR)                    | `apps/web/app/checkout/[id]/`                         |
| Mobile checkout (deep link)           | `apps/mobile-web/app/checkout/[id].tsx`               |

The domain vocabulary — Checkout Session, the session states, price
reconfirmation, and the deliberate split between inventory hold and session
expiration — is written up in [`CONTEXT.md`](./CONTEXT.md). That file is the
reference for _why_ the state machine is shaped this way; this section covers
how it's built and how to run it.

## Running it

```bash
pnpm install
cp apps/api/.env.example apps/api/.env   # DATABASE_URL only matters for the users demo route

pnpm dev              # all three via Turborepo (Expo keys won't work — no TTY)
# Prefer two terminals when you need Expo interactivity (r / j / etc.):
pnpm dev:servers      # api :4000 · web :3001
pnpm dev:mobile-web   # Expo with a real TTY (not via turbo)
# Or individually: pnpm dev:api / pnpm dev:web
```

Create a session, then open it on either surface:

```bash
# Create one (listing_1 is seeded in apps/api/src/context.ts).
# For a live price-change demo, pick "Sec 118 · Row 8 · 10s price demo" (listing_3)
# on the landing page, wait 10s on checkout, then confirm the new price.
curl -X POST localhost:4000/trpc/checkout.create \
  -H 'content-type: application/json' -d '{"listingId":"listing_1"}'

# Same session, two surfaces:
open http://localhost:3001/checkout/<sessionId>
xcrun simctl openurl booted "mobileweb://checkout/<sessionId>"
```

Note the request body is the raw input object — this tRPC server has no
superjson transformer wired up, so there is no `{"json": ...}` envelope.

## The state model

`created → active → pending_payment → completed`, with `expired` and `failed`
as the off-ramps. `failed` is retryable (it transitions back through
`pending_payment`); `completed` and `expired` are terminal.

The server is the only writer. A surface never computes state locally — it
posts an intent (`resume`, `confirmPrice`, `complete`) and renders whatever
session comes back. That's what makes two surfaces agree without either
knowing the other exists.

## How the hard parts are handled

**Resuming across surfaces.** The session ID is an opaque nanoid and is the
_only_ credential — no fan auth, matching the "send it to a friend" case in the
prompt. Possession of the ID is capability, not identity. Both surfaces call the
same `checkout.resume` and report which surface they are (`'web' | 'mobile'`),
which lands in the event log.

**Stale inventory.** Session expiration and the inventory hold are two clocks
owned by two services, and they're deliberately not collapsed. `resumeSession`
checks the hold _live_ rather than trusting its own `expiresAt` — a session can
be perfectly unexpired and still reference inventory that's gone. Those surface
to the fan as different states ("your session expired" vs. "this listing is no
longer available"). Because resume reports both as `status: 'expired'`, the
session also carries an `expiryReason` (`session_lapsed` | `hold_released`) —
without it the resume path couldn't tell the two apart, only the write path
could. Both surfaces read it to pick the right message.

**Price changes.** The session tracks `acknowledgedPrice` separately from the
listing's live price. A mismatch blocks completion with `PRECONDITION_FAILED`
until the fan explicitly confirms via `checkout.confirmPrice`. Silent repricing
is treated as a domain violation, not a UI detail — the fan always agrees to the
number they're charged.

**Duplicate completion.** This is the real hazard: two devices holding the same
resumable session, both hitting "buy." `completeSession` claims the session with
an atomic compare-and-swap to `pending_payment` _before_ charging. The swap
reads and writes with no `await` in between, so two same-tick callers cannot
both win — the loser gets `CONFLICT` and the fan is told the order is being
completed on another device. There is no time-window heuristic and no
best-effort check. `apps/api/src/domain/checkout-service.test.ts` races two
completions and asserts exactly one wins. On the UI, `pending_payment` maps to a
non-actionable **processing** view (no Buy CTA) — both when this surface just
pressed Buy and when resume finds an in-flight claim — while `CONFLICT` maps to
**claimed elsewhere**. Same “don’t buy again” outcome; different trust copy.

**Instrumentation.** Every continuity-relevant transition emits a structured
event (`session_created`, `session_resumed`, `price_reconfirmed`,
`session_expired`, `session_completed`, `session_failed`) carrying the surface,
so a cross-surface handoff is reconstructable from the log.

### Error codes

| Domain error              | tRPC code               | Fan-facing meaning                        |
| ------------------------- | ----------------------- | ----------------------------------------- |
| `SessionNotFoundError`    | `NOT_FOUND`             | Bad or unknown link                       |
| `SessionExpiredError`     | `TIMEOUT`               | Your checkout session expired             |
| `ListingUnavailableError` | `UNPROCESSABLE_CONTENT` | Listing no longer available               |
| `PriceChangedError`       | `PRECONDITION_FAILED`   | Price changed — confirm to continue       |
| `ConflictError`           | `CONFLICT`              | Already being completed on another device |

tRPC has no HTTP-410 `GONE` in its code table, so expiration and unavailability
take `TIMEOUT` and `UNPROCESSABLE_CONTENT` — the point is that they stay
_distinguishable_, and that `CONFLICT` means only one thing.

## What appears before hydration (web)

`/checkout/:id` is a React Server Component. It fetches the session server-side
and renders the listing, status, and price into the HTML document — so the fan
opening a resumed link sees real state in the first paint, with no spinner and
no loading flash, before any client JS runs. The client component takes over
afterward for the interactive parts (confirm price, complete) starting from that
same server-rendered session, so hydration is seamless rather than a re-fetch.

## Tradeoffs

- **In-memory session store, no Prisma model.** The prompt allows it, and it
  keeps reviewer setup at zero. It also makes the CAS honest at this scale — one
  process, one map. Against a real DB this becomes a conditional
  `UPDATE ... WHERE status = $expected`, which is the same idea with the same
  guarantee; the `SessionStore` interface is the seam for that swap.
- **Deterministic fakes over random failures.** `FakePaymentProvider.forceOutcome`
  and `FakeInventoryProvider.setPrice` let tests and a live demo drive any state
  transition on command. Randomized stubs would make the interesting paths
  unreproducible.
- **No auth.** Deliberate, per the domain model — the session ID is the
  capability. Real deployment would still want the ID unguessable (it is) and
  rate-limited (it isn't).
- **Resume is pull-based.** A surface learns about changes when it acts, not
  when they happen.

## With more time

- Push instead of pull — SSE or a websocket so a price change or a completion on
  the other device updates this one live, rather than being discovered on the
  next action.
- Prisma-backed session store with a real conditional update, plus a background
  sweeper to expire sessions rather than expiring lazily on read.
- Playwright E2E driving an actual cross-surface handoff — create on web,
  complete on mobile — which is the one thing the unit tests can only simulate.
- Real idempotency keys on the payment call, so a retry after a network timeout
  can't double-charge even if the process dies mid-flight.

---

## Stack

| Layer          | Choice                                                |
| -------------- | ----------------------------------------------------- |
| Monorepo       | pnpm workspaces + Turborepo                           |
| Mobile + Web   | Expo Router (React Native Web) — one app, 3 targets   |
| Styling        | NativeWind (Tailwind for RN + web)                    |
| State (server) | TanStack Query via tRPC                               |
| API            | Fastify + tRPC                                        |
| Database       | Prisma + Postgres                                     |
| Validation     | Zod schemas in `@repo/api-contracts`                  |
| Lint/format    | ESLint (flat config) + Prettier + Husky + lint-staged |
| Unit/component | Jest + React Native Testing Library                   |
| E2E (web)      | Playwright                                            |
| E2E (mobile)   | Maestro                                               |
| CI             | GitHub Actions + Turborepo remote caching             |
| Versioning     | Changesets (per-package changelogs, no npm publish)   |
| Deploy         | EAS (mobile), Vercel/EAS Hosting (web)                |

Suggested next adds (not wired yet): Clerk (or another auth provider),
Zustand for client state, React Hook Form for forms.

## Structure

```
apps/
  mobile-web/     Expo Router app — iOS, Android, and web from one codebase
  api/            Fastify + tRPC server, Prisma, router implementation
packages/
  ui/             Shared components (NativeWind)
  api-contracts/  Shared Zod schemas — the contract between client and server
  utils/          Shared helpers (use when you have cross-app pure logic)
  config/         Shared ESLint, Tailwind, and tsconfig presets
```

Ownership to copy when you fork:

- **Schemas** live in `packages/api-contracts` (imported by the API, and by
  the client when you build forms).
- **Router + Prisma** live in `apps/api`. The client type-imports
  `AppRouter` from `api` — type-only, so Metro never bundles server code.
- Add a procedure in `apps/api/src/router.ts` and a schema in
  `packages/api-contracts` when the input/output shape is shared.

## Getting started

```bash
pnpm install
cp apps/api/.env.example apps/api/.env   # set DATABASE_URL
pnpm --filter api prisma:generate
pnpm --filter api prisma:migrate

pnpm dev              # all three via Turborepo (Expo keys won't work — no TTY)
pnpm dev:servers      # api :4000 · web :3001
pnpm dev:mobile-web   # Expo with a real TTY (use alongside dev:servers)
# Or: pnpm dev:api / pnpm dev:web
```

## Common commands

```bash
pnpm lint          # ESLint across every app/package
pnpm typecheck     # tsc --noEmit across every app/package
pnpm test          # Jest unit + component tests
pnpm test:e2e:web  # Playwright, against the web build
pnpm --filter mobile-web test:e2e:mobile   # Maestro, needs a simulator/device
pnpm format        # Prettier write
```

## Versioning changes (Changesets)

After any change worth noting, run:

```bash
pnpm changeset
```

It'll ask which package(s) changed and whether it's a patch/minor/major,
then write a small file in `.changeset/`. Commit that alongside your PR.
When it's merged to `main`, the Release workflow (`.github/workflows/release.yml`)
opens/updates a "Version Packages" PR that bumps versions and writes
CHANGELOGs; merging _that_ PR is what finalizes a release. Nothing gets
published to npm — this is an app template, so changesets are just used
to keep a clean changelog per package as things evolve.

## Using this as a template

1. Rename `mobileweb` / `com.yourorg.mobileweb` in `apps/mobile-web/app.json`.
2. Set up EAS (`eas init`) for mobile builds/submits.
3. Point `DATABASE_URL` at a real Postgres instance (Supabase, Neon, RDS, etc.).
4. Wire up auth in `apps/api/src/context.ts` and add a `protectedProcedure`
   in `apps/api/src/trpc.ts`.
5. Add a `TURBO_TOKEN`/`TURBO_TEAM` secret in GitHub if you want Turborepo
   remote caching in CI (optional but speeds PRs up a lot).

## ✅ Before committing this to the template repo

Go through this list before you mark the repo "Template repository" on GitHub:

- [ ] Run `pnpm install` locally at least once and commit the resulting
      `pnpm-lock.yaml` — an unlocked template will drift immediately.
- [ ] Run `pnpm lint`, `pnpm typecheck`, and `pnpm test` and confirm all pass clean.
- [ ] Delete this checklist section (and the "Using this as a template"
      section above) once you've actually done those steps, or leave it —
      your call, but don't ship it half-followed.
- [ ] Replace every occurrence of `mobileweb` / `com.yourorg.mobileweb`
      (in `app.json`) with your real app name and bundle ID.
- [ ] Replace `yourorg` in `apps/mobile-web/e2e/maestro/flow.yaml`'s `appId` too.
- [ ] Decide on a real Postgres provider and update `apps/api/.env.example`
      accordingly (don't commit a real `.env` — it's gitignored, keep it that way).
- [ ] Confirm `.gitignore` covers your provider's local artifacts (e.g. add
      `.vercel/`, `.eas/` if those tools generate local config you don't want committed).
- [ ] If you want Turborepo remote caching in CI, add `TURBO_TOKEN` and
      `TURBO_TEAM` as GitHub Actions secrets — otherwise CI still works,
      just without cross-run caching.
- [ ] If you want the Release workflow to actually open PRs, confirm
      Actions has "Read and write permissions" enabled under
      **Settings → Actions → General → Workflow permissions**.
- [ ] Add a LICENSE file appropriate for how this template will be reused.
- [ ] Smoke-test all three targets once end-to-end: `pnpm dev:web` in a
      browser, `pnpm dev:ios`/`dev:android` in a simulator, and
      `pnpm dev:api` responding on `/health`.
- [ ] Squash/clean the git history so the template's first commit is tidy —
      nobody forking it needs your scaffolding commits.

## Extending

- **New shared component:** add it to `packages/ui/src`, export from
  `packages/ui/src/index.ts`. It's usable from `apps/mobile-web` immediately.
- **New API endpoint:** add a Zod schema to `packages/api-contracts/src/schemas`
  when the shape is shared; add the procedure in `apps/api/src/router.ts`
  and talk to Prisma via `ctx.users` (or a new store on `Context`).
- **Need real SSR/SEO for web later:** the `ui`/`api-contracts`/`utils`
  packages don't know or care what renders them — you can swap the web
  target for a Next.js app without touching shared code.
