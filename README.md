# RN + Web Template

One codebase that ships to iOS, Android, and web, backed by a fully
type-safe API. Use this as a GitHub template for new projects.

---

# Checkout Continuity

A fan starts checking out on one surface and finishes on another — start on
mobile web, get the link, finish in the native app. The checkout session is
owned by the server; each surface is just a view onto it.

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

pnpm dev              # api :4000 · web :3001 · mobile-web (Expo) together via Turborepo
# Or individually: pnpm dev:api / pnpm dev:web / pnpm dev:mobile-web
```

Create a session, then open it on either surface:

```bash
# Create one (listing_1 is seeded at $42.00 in apps/api/src/context.ts)
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
completions and asserts exactly one wins.

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

pnpm dev              # api :4000 · web :3001 · mobile-web (Expo) together
# Or: pnpm dev:api / pnpm dev:web / pnpm dev:mobile-web
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
