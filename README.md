# Notes about the demo

- **Resume directions in this demo:** **web ↔ web** (same link in another tab/browser)
  and **mobile → web** (native share/copy hands the fan a web checkout URL). There is no
  seamless **web → mobile** handoff from the browser — custom schemes (`mobileweb://…`)
  only work when the OS has registered them. For local deep-link demos use
  `xcrun simctl openurl` (below). Shared UI aims for **checkout parity** across surfaces;
  that is not the same as a bidirectional handoff product.
- Built from a personal RN + web monorepo template so shared packages (`@repo/ui`,
  tokens, contracts) actually reuse between Next and Expo — not two parallel UIs on the
  same API.
- Continuity core (session machine, resume, CAS, price reconfirm) came first; the
  product-shaped shell (selection → checkout, Gametime-like hierarchy) is deliberate
  polish on top of that slice, not a substitute for it. Prompt time box was ~2–3 hours;
  I invested past that floor on presentation and shared UI.
- **AI-assisted trail:** session notes under [`docs/`](./docs/)
  (`session_<date>_<time>_<slug>.md`) record planning and implementation passes. There
  are many of them — skim for decisions if useful; prefer this README, [`CONTEXT.md`](./CONTEXT.md),
  and [`docs/decisions.md`](./docs/decisions.md) as the review path. Notes are not a
  substitute for the code.

**Deferred on purpose (continuity slice stays honest):**

- In-memory session store + deterministic payment/inventory fakes (prompt-allowed). No
  Prisma session model, real Stripe/inventory SDKs, or auth.
- Surfaces discover changes by acting (resume / complete), not via push — except the
  live **Sec 118 · Row 8 · 10s price demo** (`listing_3`), which ages its _held_ price
  after 10s so reconfirmation is visible. Catalog seed price is unchanged if you leave
  and browse again; a new session resets the timer.
- Decline / sold-out paths are covered in unit tests via `FakePaymentProvider.forceOutcome`
  and `FakeInventoryProvider.releaseListing` (process-local helpers — **not** exposed over
  HTTP). The 10s price bump is the only failure mode you can drive from the UI without
  tests.
- No automated create-on-web / complete-on-mobile E2E. Unit tests cover the state machine
  and conflict path; handoff is verified by hand. Playwright/Maestro scaffolds from the
  template are not continuity coverage.
- Fixed 10-minute session TTL, two-tap price confirm then buy, share via opaque session
  id only. Session TTL lapse (request-time or in-process `SessionExpirySweeper`) also
  releases the inventory hold; the sweeper is single-process demo glue, not a
  multi-replica job runner.

**Beyond the basic ask:**

- Ticket landing with listing selection and a static stadium map.
- Shared design tokens + `@repo/ui` so Next SSR and native share components.
- Visual shell aligned to Gametime-style mocks; payment/promo chrome is decorative.
- Domain write-up (`CONTEXT.md`), decision log (`docs/decisions.md`), structured event log.

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
| Session TTL sweeper (releases holds)  | `apps/api/src/domain/session-expiry-sweeper.ts`       |
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
cp apps/api/.env.example apps/api/.env   # optional; DATABASE_URL only matters for the users demo route

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

`active → pending_payment → completed`, with `expired` and `failed` as the
off-ramps. `failed` is retryable (retry claims through `pending_payment` again);
`completed` and `expired` are terminal. There is no separate `created` status —
create writes `active` with the inventory hold already placed.

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

When the session clock lapses — on the next resume/complete/confirm touch or via
the in-process `SessionExpirySweeper` (~30s) — checkout also `releaseHold`s and
marks `session_lapsed`. Explicit abandon (`checkout.release`) drops the hold and
marks `hold_released`. The sweeper is single-process demo glue, not a
multi-replica job runner; mid-charge (`pending_payment`) is skipped.

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

**Instrumentation.** Continuity-relevant transitions emit structured events
(`session_created`, `session_resumed`, `price_reconfirmed`, `session_expired`,
`session_released`, `session_completed`, `session_failed`) carrying the surface
where relevant, so a cross-surface handoff is reconstructable from the in-process
log. There is no metrics API or funnel export in this prototype.

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

`/checkout/:id` is a React Server Component. It resumes the session server-side
and passes that payload into the client tree, so the first HTML paint already
includes listing, status, and price — no client mount spinner and no hydration
re-fetch. The client then owns confirm / complete interactions from that same
session.

## Tradeoffs

- **In-memory session store, no Prisma model.** The prompt allows it, and it
  keeps reviewer setup at zero. It also makes the CAS honest at this scale — one
  process, one map. Against a real DB this becomes a conditional
  `UPDATE ... WHERE status = $expected`, which is the same idea with the same
  guarantee; the `SessionStore` interface is the seam for that swap.
- **Deterministic fakes over random failures.** `forceOutcome`, `setPrice`, and
  `releaseListing` on the fake providers let unit tests drive any transition on
  command. The live UI demo path is the timed hold bump on `listing_3`; the
  other knobs are not HTTP-exposed.
- **No auth.** Deliberate, per the domain model — the session ID is the
  capability. Real deployment would still want the ID unguessable (it is) and
  rate-limited (it isn't). Auth was not stubbed behind an interface; the prompt
  listed it alongside payment/inventory, and the capability-id model is the
  explicit substitute for this slice.
- **Resume is pull-based.** A surface learns about changes when it acts, not
  when they happen.

## With more time

- Multi-replica session expiry (durable job / leader election) instead of the
  in-process sweeper, plus an indexed `expiresAt` query.
- Push instead of pull — SSE or a websocket so a price change or a completion on
  the other device updates this one live.
- Prisma-backed session store with a real conditional update.
- Playwright (or similar) E2E for create-on-web / complete-on-mobile.
- Real idempotency keys on the payment call so a retry after a network timeout
  can't double-charge if the process dies mid-flight.
- Cleaner overall UI, I definitely spent a good amount of time spitting and polishing because I hold myself to a high standard, however I would probably have done more real Gametime matching for overall look and feel.
- Made the stadium (I changed to use the actual map you use on your website) scale better with all screen sizes, responsively, and on the mobile app too
- True web to mobile deep-linking

---

## Stack

| Layer       | Choice                                                               |
| ----------- | -------------------------------------------------------------------- |
| Monorepo    | pnpm workspaces + Turborepo                                          |
| Web         | Next.js App Router (`apps/web`) — SSR checkout                       |
| Mobile      | Expo Router (`apps/mobile-web`) — iOS / Android                      |
| Shared UI   | `@repo/ui` + `@repo/tokens` (NativeWind)                             |
| API         | Fastify + tRPC (`apps/api`)                                          |
| Validation  | Zod in `@repo/api-contracts`                                         |
| Sessions    | In-memory store (Prisma/Postgres exists for a users demo route only) |
| Lint/format | ESLint + Prettier + Husky + lint-staged                              |
| Tests       | Jest + React Native Testing Library; SSR markup tests on web         |

## Structure

```
apps/
  web/            Next.js — SSR checkout + selection landing
  mobile-web/     Expo Router — native checkout + deep links
  api/            Fastify + tRPC, checkout domain, optional Prisma users demo
packages/
  ui/             Shared checkout/listings components (NativeWind)
  tokens/         Shared design tokens
  api-contracts/  Shared Zod schemas (client ↔ server contract)
  utils/          Shared pure helpers
  config/         Shared ESLint, Tailwind, and tsconfig presets
```

- **Schemas** live in `packages/api-contracts`.
- **Router + domain** live in `apps/api`. Clients type-import `AppRouter` only —
  Metro/Next never bundle server code.
- **SSR** is already owned by `apps/web`; Expo’s web target is secondary.

## Common commands

```bash
pnpm lint          # ESLint across every app/package
pnpm typecheck     # tsc --noEmit across every app/package
pnpm test          # Jest unit + component tests (continuity coverage lives here)
pnpm format        # Prettier write
```
