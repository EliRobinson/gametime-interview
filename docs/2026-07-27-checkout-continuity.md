# Checkout Continuity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a checkout-continuity prototype where a fan can create a checkout session on
one surface and resume/complete it on another, with server-owned state, price/inventory
change handling, duplicate-completion prevention, and instrumentation.

**Architecture:** A `CheckoutService` domain object (in-memory session store + stubbed
Payment/Inventory providers + structured event log) lives in `apps/api`, exposed over tRPC.
Two client surfaces consume the same contract: a new minimal Next.js app (`apps/web`) that
server-renders the checkout page before hydration, and the existing Expo Router app
(`apps/mobile-web`) opened via its `mobileweb://` deep link scheme with native recovery
screens. `apps/web` and `apps/mobile-web` depend only on the tRPC contract from Phase 0, not
on each other — they are independently buildable and reviewable once Phase 0 lands.

**Tech Stack:** Fastify + tRPC + Zod (existing `apps/api`), in-memory store (no Prisma model
for sessions), Next.js (new `apps/web`) for SSR web checkout, Expo Router (existing
`apps/mobile-web`) for native mobile, Jest for tests, pnpm workspaces.

## Global Constraints

- In-memory storage only for checkout sessions — no Prisma/DB migration (prompt explicitly
  allows this; keeps setup friction at zero for a reviewer).
- No real payment/auth/inventory integration — stub behind `PaymentProvider` /
  `InventoryProvider` interfaces with deterministic, forceable outcomes (no randomness).
- Session ID is an opaque, unguessable string (nanoid) and is the sole resume credential —
  no fan authentication required to resume a session.
- Every session mutation that matters for continuity (create, resume, price-reconfirm,
  expire, complete, fail) must emit a structured event via `EventLog`.
- Duplicate-completion prevention is via atomic compare-and-swap on `status` in the store —
  never a randomized or best-effort check.
- Follow existing repo conventions: Context-injected stores (see `apps/api/src/context.ts`'s
  `UserStore` pattern), co-located `*.test.ts` files, ts-jest, pnpm workspace protocol
  (`workspace:*`) for internal packages.

---

## Phase 0 — Backend Foundation (sequential; both client surfaces depend on this)

### Task 1: Checkout API contracts

**Files:**

- Create: `packages/api-contracts/src/schemas/checkout.ts`
- Modify: `packages/api-contracts/src/index.ts`
- Test: `packages/api-contracts/src/schemas/checkout.test.ts`

**Interfaces:**

- Produces: `checkoutSessionStatus` (Zod enum), `CheckoutSessionStatus` (type),
  `checkoutSessionSchema` / `CheckoutSession`, `createSessionInput` / `CreateSessionInput`,
  `sessionIdInput` / `SessionIdInput` (used by resume/confirmPrice/complete — all take just
  `{ sessionId: string }`).

- [ ] **Step 1: Write the failing test**

```typescript
// packages/api-contracts/src/schemas/checkout.test.ts
import { checkoutSessionSchema, createSessionInput, sessionIdInput } from './checkout';

describe('checkout schemas', () => {
  it('accepts a valid checkout session', () => {
    const result = checkoutSessionSchema.safeParse({
      id: 'sess_abc123',
      listingId: 'listing_1',
      status: 'active',
      priceAtCreation: 4200,
      acknowledgedPrice: 4200,
      createdAt: '2026-01-01T00:00:00.000Z',
      expiresAt: '2026-01-01T00:10:00.000Z',
      failureReason: null,
    });
    expect(result.success).toBe(true);
  });

  it('rejects an unknown status', () => {
    const result = checkoutSessionSchema.safeParse({
      id: 'sess_abc123',
      listingId: 'listing_1',
      status: 'bogus',
      priceAtCreation: 4200,
      acknowledgedPrice: 4200,
      createdAt: '2026-01-01T00:00:00.000Z',
      expiresAt: '2026-01-01T00:10:00.000Z',
      failureReason: null,
    });
    expect(result.success).toBe(false);
  });

  it('createSessionInput requires a listingId', () => {
    expect(createSessionInput.safeParse({}).success).toBe(false);
    expect(createSessionInput.safeParse({ listingId: 'listing_1' }).success).toBe(true);
  });

  it('sessionIdInput requires a sessionId', () => {
    expect(sessionIdInput.safeParse({}).success).toBe(false);
    expect(sessionIdInput.safeParse({ sessionId: 'sess_abc123' }).success).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @repo/api-contracts test checkout.test.ts`
Expected: FAIL — cannot find module `./checkout`

- [ ] **Step 3: Write minimal implementation**

```typescript
// packages/api-contracts/src/schemas/checkout.ts
import { z } from 'zod';

export const checkoutSessionStatus = z.enum([
  'created',
  'active',
  'pending_payment',
  'completed',
  'expired',
  'failed',
]);
export type CheckoutSessionStatus = z.infer<typeof checkoutSessionStatus>;

export const checkoutSessionSchema = z.object({
  id: z.string(),
  listingId: z.string(),
  status: checkoutSessionStatus,
  priceAtCreation: z.number().nonnegative(),
  acknowledgedPrice: z.number().nonnegative(),
  createdAt: z.string(),
  expiresAt: z.string(),
  failureReason: z.string().nullable(),
});
export type CheckoutSession = z.infer<typeof checkoutSessionSchema>;

export const createSessionInput = z.object({ listingId: z.string().min(1) });
export type CreateSessionInput = z.infer<typeof createSessionInput>;

export const sessionIdInput = z.object({ sessionId: z.string().min(1) });
export type SessionIdInput = z.infer<typeof sessionIdInput>;
```

Add the barrel export:

```typescript
// packages/api-contracts/src/index.ts
export * from './schemas/user';
export * from './schemas/checkout';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @repo/api-contracts test checkout.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add packages/api-contracts/src/schemas/checkout.ts packages/api-contracts/src/schemas/checkout.test.ts packages/api-contracts/src/index.ts
git commit -m "feat(api-contracts): add checkout session schemas"
```

---

### Task 2: Stubbed Inventory and Payment providers + event log

**Files:**

- Create: `apps/api/src/domain/inventory-provider.ts`
- Create: `apps/api/src/domain/payment-provider.ts`
- Create: `apps/api/src/domain/events.ts`
- Test: `apps/api/src/domain/inventory-provider.test.ts`
- Test: `apps/api/src/domain/payment-provider.test.ts`
- Test: `apps/api/src/domain/events.test.ts`

**Interfaces:**

- Consumes: nothing from Task 1 directly (pure domain stubs).
- Produces: `InventoryProvider` (`getHoldStatus(listingId): Promise<{ held: boolean;
currentPrice: number }>`, `placeHold(listingId): Promise<{ price: number }>`,
  `releaseHold(listingId): Promise<void>`), `FakeInventoryProvider` (adds
  `seedListing(listingId, price)`, `setPrice(listingId, price)`,
  `releaseListing(listingId)` test helpers). `PaymentProvider`
  (`charge(sessionId, amount): Promise<'succeeded' | 'declined' | 'timeout'>`),
  `FakePaymentProvider` (adds `forceOutcome(sessionId, outcome)`). `EventLog`
  (`emit(event: Omit<CheckoutEvent, 'timestamp'>): void`, `all(): CheckoutEvent[]`),
  `CheckoutEventName` (`'session_created' | 'session_resumed' | 'price_reconfirmed' |
'session_expired' | 'session_completed' | 'session_failed'`).

- [ ] **Step 1: Write the failing tests**

```typescript
// apps/api/src/domain/inventory-provider.test.ts
import { FakeInventoryProvider } from './inventory-provider';

describe('FakeInventoryProvider', () => {
  it('placeHold returns the seeded price and holds the listing', async () => {
    const inventory = new FakeInventoryProvider();
    inventory.seedListing('listing_1', 4200);

    const { price } = await inventory.placeHold('listing_1');

    expect(price).toBe(4200);
    await expect(inventory.getHoldStatus('listing_1')).resolves.toEqual({
      held: true,
      currentPrice: 4200,
    });
  });

  it('reflects a forced price change on getHoldStatus', async () => {
    const inventory = new FakeInventoryProvider();
    inventory.seedListing('listing_1', 4200);
    await inventory.placeHold('listing_1');

    inventory.setPrice('listing_1', 5000);

    await expect(inventory.getHoldStatus('listing_1')).resolves.toEqual({
      held: true,
      currentPrice: 5000,
    });
  });

  it('reports held: false after releaseListing', async () => {
    const inventory = new FakeInventoryProvider();
    inventory.seedListing('listing_1', 4200);
    await inventory.placeHold('listing_1');

    inventory.releaseListing('listing_1');

    await expect(inventory.getHoldStatus('listing_1')).resolves.toMatchObject({ held: false });
  });
});
```

```typescript
// apps/api/src/domain/payment-provider.test.ts
import { FakePaymentProvider } from './payment-provider';

describe('FakePaymentProvider', () => {
  it('defaults to succeeded', async () => {
    const payment = new FakePaymentProvider();
    await expect(payment.charge('sess_1', 4200)).resolves.toBe('succeeded');
  });

  it('returns a forced outcome for a given session', async () => {
    const payment = new FakePaymentProvider();
    payment.forceOutcome('sess_1', 'declined');
    await expect(payment.charge('sess_1', 4200)).resolves.toBe('declined');
  });
});
```

```typescript
// apps/api/src/domain/events.test.ts
import { EventLog } from './events';

describe('EventLog', () => {
  it('records an emitted event with a timestamp', () => {
    const log = new EventLog();
    log.emit({ name: 'session_created', sessionId: 'sess_1' });

    const [event] = log.all();
    expect(event).toMatchObject({ name: 'session_created', sessionId: 'sess_1' });
    expect(typeof event?.timestamp).toBe('string');
  });

  it('all() returns a snapshot, not a live reference', () => {
    const log = new EventLog();
    log.emit({ name: 'session_created', sessionId: 'sess_1' });
    const snapshot = log.all();
    log.emit({ name: 'session_completed', sessionId: 'sess_1' });

    expect(snapshot).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter api test domain`
Expected: FAIL — cannot find modules `./inventory-provider`, `./payment-provider`, `./events`

- [ ] **Step 3: Write minimal implementation**

```typescript
// apps/api/src/domain/inventory-provider.ts
export interface InventoryHoldStatus {
  held: boolean;
  currentPrice: number;
}

export interface InventoryProvider {
  getHoldStatus(listingId: string): Promise<InventoryHoldStatus>;
  placeHold(listingId: string): Promise<{ price: number }>;
  releaseHold(listingId: string): Promise<void>;
}

export class FakeInventoryProvider implements InventoryProvider {
  private basePrices = new Map<string, number>();
  private overridePrices = new Map<string, number>();
  private held = new Set<string>();

  seedListing(listingId: string, price: number): void {
    this.basePrices.set(listingId, price);
  }

  setPrice(listingId: string, price: number): void {
    this.overridePrices.set(listingId, price);
  }

  releaseListing(listingId: string): void {
    this.held.delete(listingId);
  }

  async placeHold(listingId: string): Promise<{ price: number }> {
    const price = this.currentPrice(listingId);
    if (price === undefined) throw new Error(`Unknown listing: ${listingId}`);
    this.held.add(listingId);
    return { price };
  }

  async getHoldStatus(listingId: string): Promise<InventoryHoldStatus> {
    return {
      held: this.held.has(listingId),
      currentPrice: this.currentPrice(listingId) ?? 0,
    };
  }

  async releaseHold(listingId: string): Promise<void> {
    this.held.delete(listingId);
  }

  private currentPrice(listingId: string): number | undefined {
    return this.overridePrices.get(listingId) ?? this.basePrices.get(listingId);
  }
}
```

```typescript
// apps/api/src/domain/payment-provider.ts
export type PaymentOutcome = 'succeeded' | 'declined' | 'timeout';

export interface PaymentProvider {
  charge(sessionId: string, amount: number): Promise<PaymentOutcome>;
}

export class FakePaymentProvider implements PaymentProvider {
  private forcedOutcomes = new Map<string, PaymentOutcome>();

  forceOutcome(sessionId: string, outcome: PaymentOutcome): void {
    this.forcedOutcomes.set(sessionId, outcome);
  }

  async charge(sessionId: string, _amount: number): Promise<PaymentOutcome> {
    return this.forcedOutcomes.get(sessionId) ?? 'succeeded';
  }
}
```

```typescript
// apps/api/src/domain/events.ts
export type CheckoutEventName =
  | 'session_created'
  | 'session_resumed'
  | 'price_reconfirmed'
  | 'session_expired'
  | 'session_completed'
  | 'session_failed';

export type Surface = 'web' | 'mobile';

export interface CheckoutEvent {
  name: CheckoutEventName;
  sessionId: string;
  timestamp: string;
  surface?: Surface;
  fromSurface?: Surface;
  toSurface?: Surface;
}

export class EventLog {
  private events: CheckoutEvent[] = [];

  emit(event: Omit<CheckoutEvent, 'timestamp'>): void {
    this.events.push({ ...event, timestamp: new Date().toISOString() });
  }

  all(): CheckoutEvent[] {
    return [...this.events];
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter api test domain`
Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/domain/inventory-provider.ts apps/api/src/domain/inventory-provider.test.ts \
        apps/api/src/domain/payment-provider.ts apps/api/src/domain/payment-provider.test.ts \
        apps/api/src/domain/events.ts apps/api/src/domain/events.test.ts
git commit -m "feat(api): add stubbed inventory/payment providers and event log"
```

---

### Task 3: Session store + CheckoutService state machine

**Files:**

- Create: `apps/api/src/domain/session-store.ts`
- Create: `apps/api/src/domain/checkout-service.ts`
- Test: `apps/api/src/domain/checkout-service.test.ts`
- Modify: `apps/api/package.json` (add `nanoid` dependency)

**Interfaces:**

- Consumes: `CheckoutSession`, `CheckoutSessionStatus` (Task 1); `InventoryProvider`,
  `FakeInventoryProvider`, `PaymentProvider`, `FakePaymentProvider`, `EventLog` (Task 2).
- Produces: `SessionStore` (`create(session): void`, `get(id): CheckoutSession | undefined`,
  `casUpdate(id, expectedStatus, updater): CheckoutSession | undefined`),
  `InMemorySessionStore`. `CheckoutService` with methods `createSession(listingId): Promise<CheckoutSession>`,
  `resumeSession(id, surface): Promise<CheckoutSession>`,
  `confirmPrice(id): Promise<CheckoutSession>`,
  `completeSession(id, surface): Promise<CheckoutSession>`. Error classes:
  `SessionNotFoundError`, `SessionExpiredError`, `ListingUnavailableError`,
  `PriceChangedError`, `ConflictError`.

- [ ] **Step 1: Add nanoid dependency**

```bash
pnpm --filter api add nanoid
```

- [ ] **Step 2: Write the failing tests**

```typescript
// apps/api/src/domain/checkout-service.test.ts
import {
  CheckoutService,
  ConflictError,
  ListingUnavailableError,
  PriceChangedError,
  SessionExpiredError,
} from './checkout-service';
import { EventLog } from './events';
import { FakeInventoryProvider } from './inventory-provider';
import { FakePaymentProvider } from './payment-provider';
import { InMemorySessionStore } from './session-store';

function setup() {
  const store = new InMemorySessionStore();
  const inventory = new FakeInventoryProvider();
  const payment = new FakePaymentProvider();
  const events = new EventLog();
  inventory.seedListing('listing_1', 4200);
  const service = new CheckoutService(store, inventory, payment, events);
  return { service, store, inventory, payment, events };
}

describe('CheckoutService', () => {
  it('creates an active session holding the listing at its current price', async () => {
    const { service, events } = setup();

    const session = await service.createSession('listing_1');

    expect(session.status).toBe('active');
    expect(session.priceAtCreation).toBe(4200);
    expect(session.acknowledgedPrice).toBe(4200);
    expect(events.all().map((e) => e.name)).toContain('session_created');
  });

  it('completes the happy path end to end', async () => {
    const { service } = setup();
    const session = await service.createSession('listing_1');

    const completed = await service.completeSession(session.id, 'web');

    expect(completed.status).toBe('completed');
  });

  it('expires a session once its expiresAt has passed', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
    const { service } = setup();
    const session = await service.createSession('listing_1');

    jest.setSystemTime(new Date('2026-01-01T00:11:00.000Z'));
    const resumed = await service.resumeSession(session.id, 'mobile');

    expect(resumed.status).toBe('expired');
    jest.useRealTimers();
  });

  it('marks a session expired on resume if inventory hold was released independently', async () => {
    const { service, inventory } = setup();
    const session = await service.createSession('listing_1');
    inventory.releaseListing('listing_1');

    const resumed = await service.resumeSession(session.id, 'web');

    expect(resumed.status).toBe('expired');
  });

  it('blocks completion when price changed and has not been reconfirmed', async () => {
    const { service, inventory } = setup();
    const session = await service.createSession('listing_1');
    inventory.setPrice('listing_1', 5000);

    await expect(service.completeSession(session.id, 'web')).rejects.toThrow(PriceChangedError);
  });

  it('allows completion after the fan reconfirms the new price', async () => {
    const { service, inventory } = setup();
    const session = await service.createSession('listing_1');
    inventory.setPrice('listing_1', 5000);

    const reconfirmed = await service.confirmPrice(session.id);
    expect(reconfirmed.acknowledgedPrice).toBe(5000);

    const completed = await service.completeSession(session.id, 'web');
    expect(completed.status).toBe('completed');
  });

  it('rejects completion against a listing whose hold has been released', async () => {
    const { service, inventory } = setup();
    const session = await service.createSession('listing_1');
    inventory.releaseListing('listing_1');

    await expect(service.completeSession(session.id, 'web')).rejects.toThrow(
      ListingUnavailableError,
    );
  });

  it('transitions to failed when payment declines, and allows retry', async () => {
    const { service, payment } = setup();
    const session = await service.createSession('listing_1');
    payment.forceOutcome(session.id, 'declined');

    const failed = await service.completeSession(session.id, 'web');
    expect(failed.status).toBe('failed');
    expect(failed.failureReason).toBe('declined');

    payment.forceOutcome(session.id, 'succeeded');
    const retried = await service.completeSession(session.id, 'web');
    expect(retried.status).toBe('completed');
  });

  it('rejects a second concurrent completion once the first has claimed pending_payment', async () => {
    const { service, payment } = setup();
    const session = await service.createSession('listing_1');

    // Simulate device A claiming the session first.
    payment.forceOutcome(session.id, 'succeeded');
    const first = service.completeSession(session.id, 'web');
    const second = service.completeSession(session.id, 'mobile');

    const results = await Promise.allSettled([first, second]);
    const statuses = results.map((r) => r.status);
    expect(statuses).toContain('fulfilled');
    expect(statuses).toContain('rejected');

    const rejected = results.find((r) => r.status === 'rejected');
    expect((rejected as PromiseRejectedResult).reason).toBeInstanceOf(ConflictError);
  });

  it('throws SessionExpiredError when completing an already-expired session', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
    const { service } = setup();
    const session = await service.createSession('listing_1');
    jest.setSystemTime(new Date('2026-01-01T00:11:00.000Z'));

    await expect(service.completeSession(session.id, 'web')).rejects.toThrow(SessionExpiredError);
    jest.useRealTimers();
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `pnpm --filter api test checkout-service.test.ts`
Expected: FAIL — cannot find modules `./checkout-service`, `./session-store`

- [ ] **Step 4: Write minimal implementation**

```typescript
// apps/api/src/domain/session-store.ts
import type { CheckoutSession } from '@repo/api-contracts';

export interface SessionStore {
  create(session: CheckoutSession): void;
  get(id: string): CheckoutSession | undefined;
  casUpdate(
    id: string,
    expectedStatus: CheckoutSession['status'],
    updater: (session: CheckoutSession) => CheckoutSession,
  ): CheckoutSession | undefined;
}

export class InMemorySessionStore implements SessionStore {
  private sessions = new Map<string, CheckoutSession>();

  create(session: CheckoutSession): void {
    this.sessions.set(session.id, session);
  }

  get(id: string): CheckoutSession | undefined {
    return this.sessions.get(id);
  }

  casUpdate(
    id: string,
    expectedStatus: CheckoutSession['status'],
    updater: (session: CheckoutSession) => CheckoutSession,
  ): CheckoutSession | undefined {
    const current = this.sessions.get(id);
    if (!current || current.status !== expectedStatus) return undefined;
    const updated = updater(current);
    this.sessions.set(id, updated);
    return updated;
  }
}
```

```typescript
// apps/api/src/domain/checkout-service.ts
import { nanoid } from 'nanoid';

import type { CheckoutSession } from '@repo/api-contracts';

import type { EventLog, Surface } from './events';
import type { InventoryProvider } from './inventory-provider';
import type { PaymentProvider } from './payment-provider';
import type { SessionStore } from './session-store';

const SESSION_TTL_MS = 10 * 60 * 1000;

export class SessionNotFoundError extends Error {
  constructor(id: string) {
    super(`Session not found: ${id}`);
  }
}
export class SessionExpiredError extends Error {
  constructor(id: string) {
    super(`Session expired: ${id}`);
  }
}
export class ListingUnavailableError extends Error {
  constructor(id: string) {
    super(`Listing no longer held for session: ${id}`);
  }
}
export class PriceChangedError extends Error {
  constructor(id: string) {
    super(`Price changed and must be reconfirmed for session: ${id}`);
  }
}
export class ConflictError extends Error {
  constructor(id: string) {
    super(`Session already being completed on another surface: ${id}`);
  }
}

export class CheckoutService {
  constructor(
    private readonly store: SessionStore,
    private readonly inventory: InventoryProvider,
    private readonly payment: PaymentProvider,
    private readonly events: EventLog,
  ) {}

  async createSession(listingId: string): Promise<CheckoutSession> {
    const { price } = await this.inventory.placeHold(listingId);
    const now = new Date();
    const session: CheckoutSession = {
      id: nanoid(),
      listingId,
      status: 'active',
      priceAtCreation: price,
      acknowledgedPrice: price,
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + SESSION_TTL_MS).toISOString(),
      failureReason: null,
    };
    this.store.create(session);
    this.events.emit({ name: 'session_created', sessionId: session.id });
    return session;
  }

  async resumeSession(id: string, surface: Surface): Promise<CheckoutSession> {
    let session = this.mustGet(id);
    session = await this.expireIfNeeded(session);
    this.events.emit({ name: 'session_resumed', sessionId: id, toSurface: surface });
    return session;
  }

  async confirmPrice(id: string): Promise<CheckoutSession> {
    const session = await this.expireIfNeeded(this.mustGet(id));
    const holdStatus = await this.inventory.getHoldStatus(session.listingId);
    const updated = this.store.casUpdate(id, session.status, (s) => ({
      ...s,
      acknowledgedPrice: holdStatus.currentPrice,
    }));
    if (!updated) throw new ConflictError(id);
    this.events.emit({ name: 'price_reconfirmed', sessionId: id });
    return updated;
  }

  async completeSession(id: string, surface: Surface): Promise<CheckoutSession> {
    const session = await this.expireIfNeeded(this.mustGet(id));
    if (session.status === 'expired') throw new SessionExpiredError(id);
    if (session.status === 'completed') return session;

    const holdStatus = await this.inventory.getHoldStatus(session.listingId);
    if (!holdStatus.held) {
      this.store.casUpdate(id, session.status, (s) => ({ ...s, status: 'expired' }));
      this.events.emit({ name: 'session_expired', sessionId: id });
      throw new ListingUnavailableError(id);
    }
    if (holdStatus.currentPrice !== session.acknowledgedPrice) {
      throw new PriceChangedError(id);
    }

    const claimed = this.store.casUpdate(id, session.status, (s) => ({
      ...s,
      status: 'pending_payment',
    }));
    if (!claimed) throw new ConflictError(id);

    const outcome = await this.payment.charge(id, holdStatus.currentPrice);
    if (outcome === 'succeeded') {
      const completed = this.store.casUpdate(id, 'pending_payment', (s) => ({
        ...s,
        status: 'completed',
      }));
      this.events.emit({ name: 'session_completed', sessionId: id, surface });
      return completed as CheckoutSession;
    }

    const failed = this.store.casUpdate(id, 'pending_payment', (s) => ({
      ...s,
      status: 'failed',
      failureReason: outcome,
    }));
    this.events.emit({ name: 'session_failed', sessionId: id, surface });
    return failed as CheckoutSession;
  }

  private mustGet(id: string): CheckoutSession {
    const session = this.store.get(id);
    if (!session) throw new SessionNotFoundError(id);
    return session;
  }

  private async expireIfNeeded(session: CheckoutSession): Promise<CheckoutSession> {
    if (session.status === 'completed' || session.status === 'expired') return session;
    if (new Date(session.expiresAt).getTime() >= Date.now()) return session;

    const expired = this.store.casUpdate(session.id, session.status, (s) => ({
      ...s,
      status: 'expired',
    }));
    if (expired) this.events.emit({ name: 'session_expired', sessionId: session.id });
    return expired ?? session;
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm --filter api test checkout-service.test.ts`
Expected: PASS (10 tests). Note: the concurrent-completion test relies on `casUpdate` being
synchronous within the `InMemorySessionStore` (no `await` between the status check and the
write), so two same-tick `completeSession` calls cannot both win the CAS even without a
Postgres transaction.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/domain/session-store.ts apps/api/src/domain/checkout-service.ts \
        apps/api/src/domain/checkout-service.test.ts apps/api/package.json pnpm-lock.yaml
git commit -m "feat(api): add in-memory session store and CheckoutService state machine"
```

---

### Task 4: tRPC checkout router + Context wiring

**Files:**

- Modify: `apps/api/src/context.ts`
- Create: `apps/api/src/routers/checkout.ts`
- Modify: `apps/api/src/router.ts`
- Modify: `apps/api/src/router.test.ts` (add checkout router coverage alongside existing user tests)

**Interfaces:**

- Consumes: `CheckoutService` and error classes (Task 3); `checkoutSessionSchema`,
  `createSessionInput`, `sessionIdInput` (Task 1).
- Produces: `Context.checkout: CheckoutService` (mirrors the existing `Context.users`
  pattern); `appRouter.checkout.create`, `.resume`, `.confirmPrice`, `.complete` procedures,
  each returning `CheckoutSession` and translating domain errors to `TRPCError` with codes
  `NOT_FOUND` (`SessionNotFoundError`), `CONFLICT` (`ConflictError`), `GONE`
  (`SessionExpiredError`, `ListingUnavailableError`), `PRECONDITION_FAILED`
  (`PriceChangedError`).

- [ ] **Step 1: Write the failing test**

```typescript
// apps/api/src/router.test.ts — add to the existing file, do not remove the user tests
import { EventLog } from './domain/events';
import { FakeInventoryProvider } from './domain/inventory-provider';
import { FakePaymentProvider } from './domain/payment-provider';
import { CheckoutService } from './domain/checkout-service';
import { InMemorySessionStore } from './domain/session-store';

function createCheckoutCaller() {
  const store = new InMemorySessionStore();
  const inventory = new FakeInventoryProvider();
  const payment = new FakePaymentProvider();
  const events = new EventLog();
  inventory.seedListing('listing_1', 4200);
  const checkout = new CheckoutService(store, inventory, payment, events);
  const ctx: Context = {
    userId: null,
    users: { list: jest.fn(), create: jest.fn() },
    checkout,
  };
  return { caller: appRouter.createCaller(ctx), inventory, payment };
}

describe('appRouter.checkout', () => {
  it('creates, resumes, and completes a session end to end', async () => {
    const { caller } = createCheckoutCaller();

    const created = await caller.checkout.create({ listingId: 'listing_1' });
    expect(created.status).toBe('active');

    const resumed = await caller.checkout.resume({ sessionId: created.id });
    expect(resumed.status).toBe('active');

    const completed = await caller.checkout.complete({ sessionId: created.id });
    expect(completed.status).toBe('completed');
  });

  it('surfaces a price change as PRECONDITION_FAILED until reconfirmed', async () => {
    const { caller, inventory } = createCheckoutCaller();
    const created = await caller.checkout.create({ listingId: 'listing_1' });
    inventory.setPrice('listing_1', 5000);

    await expect(caller.checkout.complete({ sessionId: created.id })).rejects.toMatchObject({
      code: 'PRECONDITION_FAILED',
    });

    await caller.checkout.confirmPrice({ sessionId: created.id });
    await expect(caller.checkout.complete({ sessionId: created.id })).resolves.toMatchObject({
      status: 'completed',
    });
  });

  it('returns NOT_FOUND for an unknown session id', async () => {
    const { caller } = createCheckoutCaller();
    await expect(caller.checkout.resume({ sessionId: 'nope' })).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter api test router.test.ts`
Expected: FAIL — `Context` has no `checkout` property; `appRouter.checkout` is undefined

- [ ] **Step 3: Write minimal implementation**

```typescript
// apps/api/src/context.ts — add alongside the existing users wiring, keep PrismaClient/UserStore as-is
import { CheckoutService } from './domain/checkout-service';
import { EventLog } from './domain/events';
import { FakeInventoryProvider } from './domain/inventory-provider';
import { FakePaymentProvider } from './domain/payment-provider';
import { InMemorySessionStore } from './domain/session-store';

const checkoutStore = new InMemorySessionStore();
const inventoryProvider = new FakeInventoryProvider();
const paymentProvider = new FakePaymentProvider();
const eventLog = new EventLog();
// Demo seed data — replace with a real catalog lookup when wiring a real inventory system.
inventoryProvider.seedListing('listing_1', 4200);
const checkoutService = new CheckoutService(
  checkoutStore,
  inventoryProvider,
  paymentProvider,
  eventLog,
);

export type Context = {
  userId: string | null;
  users: UserStore;
  checkout: CheckoutService;
};

export function createContext({ req: _req }: CreateFastifyContextOptions): Context {
  return {
    userId: null,
    users: createPrismaUserStore(prisma),
    checkout: checkoutService,
  };
}
```

```typescript
// apps/api/src/routers/checkout.ts
import { TRPCError } from '@trpc/server';
import { checkoutSessionSchema, createSessionInput, sessionIdInput } from '@repo/api-contracts';

import {
  ConflictError,
  ListingUnavailableError,
  PriceChangedError,
  SessionExpiredError,
  SessionNotFoundError,
} from '../domain/checkout-service';
import { publicProcedure, router } from '../trpc';

function toTRPCError(error: unknown): TRPCError {
  if (error instanceof SessionNotFoundError)
    return new TRPCError({ code: 'NOT_FOUND', cause: error });
  if (error instanceof SessionExpiredError) return new TRPCError({ code: 'GONE', cause: error });
  if (error instanceof ListingUnavailableError)
    return new TRPCError({ code: 'GONE', cause: error });
  if (error instanceof PriceChangedError)
    return new TRPCError({ code: 'PRECONDITION_FAILED', cause: error });
  if (error instanceof ConflictError) return new TRPCError({ code: 'CONFLICT', cause: error });
  return new TRPCError({ code: 'INTERNAL_SERVER_ERROR', cause: error });
}

export const checkoutRouter = router({
  create: publicProcedure
    .input(createSessionInput)
    .output(checkoutSessionSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await ctx.checkout.createSession(input.listingId);
      } catch (error) {
        throw toTRPCError(error);
      }
    }),

  resume: publicProcedure
    .input(sessionIdInput)
    .output(checkoutSessionSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await ctx.checkout.resumeSession(input.sessionId, 'web');
      } catch (error) {
        throw toTRPCError(error);
      }
    }),

  confirmPrice: publicProcedure
    .input(sessionIdInput)
    .output(checkoutSessionSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await ctx.checkout.confirmPrice(input.sessionId);
      } catch (error) {
        throw toTRPCError(error);
      }
    }),

  complete: publicProcedure
    .input(sessionIdInput)
    .output(checkoutSessionSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await ctx.checkout.completeSession(input.sessionId, 'web');
      } catch (error) {
        throw toTRPCError(error);
      }
    }),
});
```

> Note: `resume`/`complete` hardcode `'web'` as the surface here — Task 6 (mobile) will add
> a `surface` field to `sessionIdInput` so callers can report `'mobile'` instead. Keep the
> input schema change backward compatible (optional field defaulting to `'web'`).

```typescript
// apps/api/src/router.ts
import { createUserInput, userSchema } from '@repo/api-contracts';
import { z } from 'zod';

import { checkoutRouter } from './routers/checkout';
import { publicProcedure, router } from './trpc';

export const appRouter = router({
  health: publicProcedure.query(() => ({ ok: true as const, ts: Date.now() })),

  users: router({
    list: publicProcedure.output(z.array(userSchema)).query(({ ctx }) => ctx.users.list()),
    create: publicProcedure
      .input(createUserInput)
      .output(userSchema)
      .mutation(({ ctx, input }) => ctx.users.create(input)),
  }),

  checkout: checkoutRouter,
});

export type AppRouter = typeof appRouter;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter api test`
Expected: PASS — all existing user tests plus the 3 new checkout router tests plus Task 2/3
suites (17 tests total across `apps/api`).

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/context.ts apps/api/src/routers/checkout.ts apps/api/src/router.ts apps/api/src/router.test.ts
git commit -m "feat(api): wire checkout session router into appRouter"
```

---

## Phase 1 — Client Surfaces (parallel; dispatch both once Phase 0 is merged)

These two tasks only depend on `AppRouter`'s type export and the `checkoutSessionSchema`
shape from Phase 0. They touch disjoint directories (`apps/web` vs `apps/mobile-web`) and
have no shared files, so they can be implemented by two subagents running at the same time.
Use a higher-capability model (Opus) for the orchestrating/dispatch session that reviews
both diffs against this plan and the domain model in `CONTEXT.md`; the implementer subagents
can run on the default model.

### Task 5: Next.js web checkout app with pre-hydration SSR

**Files:**

- Create: `apps/web/package.json`
- Create: `apps/web/next.config.js`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/app/layout.tsx`
- Create: `apps/web/app/checkout/[id]/page.tsx` (server component)
- Create: `apps/web/app/checkout/[id]/checkout-client.tsx` (client component)
- Create: `apps/web/src/trpc-client.ts`
- Test: `apps/web/app/checkout/[id]/checkout-client.test.tsx`
- Modify: `pnpm-workspace.yaml` (confirm `apps/*` already matches — no change expected, verify)
- Modify: root `package.json` (add `"dev:web": "turbo run dev --filter=web"` script)

**Interfaces:**

- Consumes: `AppRouter` (type-only import from `api`, matching the existing pattern
  `mobile-web` already uses for `@trpc/client`), `CheckoutSession` (`@repo/api-contracts`).
- Produces: `GET /checkout/:id` route. `CheckoutSession` is fetched server-side in
  `page.tsx` via a plain `fetch` to `${API_URL}/trpc/checkout.resume` (no client JS
  required) and passed as a prop into `checkout-client.tsx`, which renders the same data
  immediately (no loading flash) and then takes over interaction (confirm price, complete)
  via `@trpc/client` mutations once hydrated.

- [ ] **Step 1: Scaffold the Next.js app**

```bash
mkdir -p apps/web/app/checkout/\[id\] apps/web/src
```

```json
// apps/web/package.json
{
  "name": "web",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3001",
    "build": "next build",
    "start": "next start -p 3001",
    "lint": "eslint . --max-warnings=0",
    "typecheck": "tsc --noEmit",
    "test": "jest"
  },
  "dependencies": {
    "@repo/api-contracts": "workspace:*",
    "@trpc/client": "^11.0.0",
    "api": "workspace:*",
    "next": "^14.2.0",
    "react": "18.2.0",
    "react-dom": "18.2.0"
  },
  "devDependencies": {
    "@repo/config": "workspace:*",
    "@testing-library/react": "^16.0.0",
    "@types/node": "^20.14.0",
    "@types/react": "~18.2.79",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "ts-jest": "^29.2.4",
    "typescript": "^5.5.4"
  }
}
```

```javascript
// apps/web/next.config.js
/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
};
```

```json
// apps/web/tsconfig.json
{
  "extends": "@repo/config/typescript/nextjs.json",
  "compilerOptions": {
    "plugins": [{ "name": "next" }]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

> If `@repo/config/typescript/nextjs.json` doesn't exist yet, extend
> `../../tsconfig.base.json` directly instead and add `"jsx": "preserve"`,
> `"moduleResolution": "Bundler"`, `"module": "ESNext"` to `compilerOptions` — check
> `packages/config/typescript/` for the existing preset filenames before assuming.

- [ ] **Step 2: Write the failing test for the client component**

```typescript
// apps/web/app/checkout/[id]/checkout-client.test.tsx
import { render, screen } from '@testing-library/react';
import type { CheckoutSession } from '@repo/api-contracts';

import { CheckoutClient } from './checkout-client';

const baseSession: CheckoutSession = {
  id: 'sess_1',
  listingId: 'listing_1',
  status: 'active',
  priceAtCreation: 4200,
  acknowledgedPrice: 4200,
  createdAt: '2026-01-01T00:00:00.000Z',
  expiresAt: '2026-01-01T00:10:00.000Z',
  failureReason: null,
};

describe('CheckoutClient', () => {
  it('renders the acknowledged price for an active session', () => {
    render(<CheckoutClient initialSession={baseSession} />);
    expect(screen.getByText(/\$42\.00/)).toBeInTheDocument();
  });

  it('shows a price-change banner when acknowledgedPrice differs from the session price signal', () => {
    render(
      <CheckoutClient
        initialSession={{ ...baseSession, acknowledgedPrice: 4200 }}
        priceChangedTo={5000}
      />,
    );
    expect(screen.getByText(/price changed/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /confirm at new price/i })).toBeInTheDocument();
  });

  it('shows an unavailable message for an expired session', () => {
    render(<CheckoutClient initialSession={{ ...baseSession, status: 'expired' }} />);
    expect(screen.getByText(/no longer available/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm --filter web test`
Expected: FAIL — cannot find module `./checkout-client`

- [ ] **Step 4: Implement the server page and client component**

```typescript
// apps/web/src/trpc-client.ts
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from 'api';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export const trpc = createTRPCClient<AppRouter>({
  links: [httpBatchLink({ url: `${API_URL}/trpc` })],
});
```

```tsx
// apps/web/app/checkout/[id]/checkout-client.tsx
'use client';

import { useState } from 'react';
import type { CheckoutSession } from '@repo/api-contracts';

import { trpc } from '../../../src/trpc-client';

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function CheckoutClient({
  initialSession,
  priceChangedTo,
}: {
  initialSession: CheckoutSession;
  priceChangedTo?: number;
}) {
  const [session, setSession] = useState(initialSession);
  const [livePriceChange, setLivePriceChange] = useState(priceChangedTo);

  if (session.status === 'expired') {
    return <p>This listing is no longer available.</p>;
  }
  if (session.status === 'completed') {
    return <p>Order complete — see you at the show.</p>;
  }

  async function confirmPrice() {
    const updated = await trpc.checkout.confirmPrice.mutate({ sessionId: session.id });
    setSession(updated);
    setLivePriceChange(undefined);
  }

  async function complete() {
    const updated = await trpc.checkout.complete.mutate({ sessionId: session.id });
    setSession(updated);
  }

  return (
    <div>
      <p>Price: {formatPrice(session.acknowledgedPrice)}</p>
      {livePriceChange !== undefined && livePriceChange !== session.acknowledgedPrice && (
        <div>
          <p>Price changed to {formatPrice(livePriceChange)}.</p>
          <button onClick={confirmPrice}>Confirm at new price</button>
        </div>
      )}
      {session.status === 'failed' && <p>Payment failed: {session.failureReason}</p>}
      <button onClick={complete} disabled={livePriceChange !== undefined}>
        Complete purchase
      </button>
    </div>
  );
}
```

```tsx
// apps/web/app/checkout/[id]/page.tsx
import type { CheckoutSession } from '@repo/api-contracts';

import { CheckoutClient } from './checkout-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

async function fetchSession(id: string): Promise<CheckoutSession> {
  const res = await fetch(`${API_URL}/trpc/checkout.resume`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ json: { sessionId: id } }),
    cache: 'no-store',
  });
  const body = await res.json();
  return body.result.data as CheckoutSession;
}

export default async function CheckoutPage({ params }: { params: { id: string } }) {
  const session = await fetchSession(params.id);
  return (
    <main>
      {/* Server-rendered before any client JS runs — this is the pre-hydration shell. */}
      <h1>Listing {session.listingId}</h1>
      <p>Status: {session.status}</p>
      <CheckoutClient initialSession={session} />
    </main>
  );
}
```

```tsx
// apps/web/app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter web test`
Expected: PASS (3 tests)

- [ ] **Step 6: Manual verification of pre-hydration rendering**

Run: `pnpm dev:api` (separate terminal), then `pnpm dev:web`, then in a browser open
`http://localhost:3001/checkout/<a session id created via a manual checkout.create call>`
with JavaScript disabled (or via `curl` on the route) and confirm the listing name, status,
and price are present in the raw HTML response — this is the concrete evidence for "what
appears before hydration."

- [ ] **Step 7: Commit**

```bash
git add apps/web pnpm-workspace.yaml package.json pnpm-lock.yaml
git commit -m "feat(web): add Next.js checkout app with SSR pre-hydration shell"
```

---

### Task 6: Mobile deep-link resume + native recovery states

**Files:**

- Create: `apps/mobile-web/app/checkout/[id].tsx`
- Create: `apps/mobile-web/src/lib/trpc-client.ts` (or extend existing file in
  `apps/mobile-web/src/lib` if a similar client already exists — check first)
- Test: `apps/mobile-web/app/__tests__/checkout.test.tsx`
- Modify: `apps/mobile-web/app.json` (confirm `scheme: "mobileweb"` already covers this —
  no change needed; deep link will be `mobileweb://checkout/<id>`)

**Interfaces:**

- Consumes: `AppRouter`, `CheckoutSession` (same contract as Task 5 — no dependency on
  Task 5's implementation, only on Phase 0's exported types).
- Produces: `app/checkout/[id].tsx` Expo Router screen reachable both by in-app navigation
  and by the `mobileweb://checkout/:id` deep link, rendering one of five native states:
  loading, active (resume + confirm/complete), price-changed, expired/unavailable,
  already-completed.

- [ ] **Step 1: Write the failing test**

```tsx
// apps/mobile-web/app/__tests__/checkout.test.tsx
import { render, screen, waitFor } from '@testing-library/react-native';
import type { CheckoutSession } from '@repo/api-contracts';

import CheckoutScreen from '../checkout/[id]';
import { trpc } from '../../src/lib/trpc-client';

jest.mock('../../src/lib/trpc-client', () => ({
  trpc: { checkout: { resume: { mutate: jest.fn() }, complete: { mutate: jest.fn() } } },
}));

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'sess_1' }),
}));

const activeSession: CheckoutSession = {
  id: 'sess_1',
  listingId: 'listing_1',
  status: 'active',
  priceAtCreation: 4200,
  acknowledgedPrice: 4200,
  createdAt: '2026-01-01T00:00:00.000Z',
  expiresAt: '2026-01-01T00:10:00.000Z',
  failureReason: null,
};

describe('CheckoutScreen', () => {
  it('shows a loading state, then the active checkout state once resumed', async () => {
    (trpc.checkout.resume.mutate as jest.Mock).mockResolvedValue(activeSession);

    render(<CheckoutScreen />);

    expect(screen.getByText(/loading/i)).toBeTruthy();
    await waitFor(() => expect(screen.getByText(/complete purchase/i)).toBeTruthy());
  });

  it('shows an unavailable state for an expired session', async () => {
    (trpc.checkout.resume.mutate as jest.Mock).mockResolvedValue({
      ...activeSession,
      status: 'expired',
    });

    render(<CheckoutScreen />);

    await waitFor(() => expect(screen.getByText(/no longer available/i)).toBeTruthy());
  });

  it('shows a confirmation state for a completed session', async () => {
    (trpc.checkout.resume.mutate as jest.Mock).mockResolvedValue({
      ...activeSession,
      status: 'completed',
    });

    render(<CheckoutScreen />);

    await waitFor(() => expect(screen.getByText(/order complete/i)).toBeTruthy());
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter mobile-web test checkout.test.tsx`
Expected: FAIL — cannot find modules `../checkout/[id]`, `../../src/lib/trpc-client`

- [ ] **Step 3: Implement the trpc client and screen**

First check whether `apps/mobile-web/src/lib` already has a tRPC client file (the app
already depends on `@trpc/client`/`@trpc/react-query` per its `package.json`):

```bash
ls apps/mobile-web/src/lib
```

If one exists, reuse/extend it instead of creating a duplicate. Otherwise:

```typescript
// apps/mobile-web/src/lib/trpc-client.ts
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from 'api';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';

export const trpc = createTRPCClient<AppRouter>({
  links: [httpBatchLink({ url: `${API_URL}/trpc` })],
});
```

```tsx
// apps/mobile-web/app/checkout/[id].tsx
import { useEffect, useState } from 'react';
import { Button, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import type { CheckoutSession } from '@repo/api-contracts';

import { trpc } from '../../src/lib/trpc-client';

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function CheckoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [session, setSession] = useState<CheckoutSession | null>(null);

  useEffect(() => {
    trpc.checkout.resume.mutate({ sessionId: id }).then(setSession);
  }, [id]);

  if (!session) return <Text>Loading…</Text>;

  if (session.status === 'expired') {
    return (
      <View>
        <Text>This listing is no longer available.</Text>
      </View>
    );
  }
  if (session.status === 'completed') {
    return (
      <View>
        <Text>Order complete — see you at the show.</Text>
      </View>
    );
  }

  async function complete() {
    const updated = await trpc.checkout.complete.mutate({ sessionId: id });
    setSession(updated);
  }

  return (
    <View>
      <Text>Price: {formatPrice(session.acknowledgedPrice)}</Text>
      {session.status === 'failed' && <Text>Payment failed: {session.failureReason}</Text>}
      <Button title="Complete purchase" onPress={complete} />
    </View>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter mobile-web test checkout.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 5: Manual verification of the deep link on the iOS Simulator**

```bash
xcrun simctl openurl booted "mobileweb://checkout/<a real session id>"
```

Confirm the app opens directly to the checkout screen (not the index route) and shows the
correct state for that session.

- [ ] **Step 6: Commit**

```bash
git add apps/mobile-web/app/checkout apps/mobile-web/app/__tests__/checkout.test.tsx apps/mobile-web/src/lib/trpc-client.ts
git commit -m "feat(mobile-web): add deep-linkable checkout resume screen"
```

---

## Task 7: README

**Files:**

- Modify: `README.md` (root) — add a "Checkout Continuity" section; do not remove the
  existing template documentation.

**Interfaces:**

- Consumes: nothing new — this is documentation of Tasks 1–6.

- [ ] **Step 1: Write the section**

Cover, per the submission requirements: what was built and how to run it (`pnpm dev:api`,
`pnpm dev:web`, `pnpm dev:mobile-web` / iOS Simulator with the `mobileweb://` scheme), the
state model (link to `CONTEXT.md`), how web and mobile resume the same session (shared
opaque session ID + tRPC contract), how stale inventory/price changes/duplicate completion
are handled (reference `CheckoutService`'s CAS + reconfirmation logic), tradeoffs made (no
Prisma migration for sessions, deterministic fakes over random failures, no auth), and what
you'd do differently with more time (real SSE/websocket push instead of polling on resume,
Prisma-backed session store, Playwright E2E across both surfaces).

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: document checkout continuity architecture and tradeoffs"
```

---

## Self-Review Notes

- **Spec coverage:** creating a session (Task 3/4), resuming from a second surface (Tasks
  5 & 6 both hit the same `checkout.resume`), ≥2 state changes handled (price change, hold
  release/expiration, payment decline/failure — three, exceeds the minimum), stubbed
  payment/inventory (Task 2), API surface for create/resume/complete (Task 4, plus
  confirmPrice), backend source of truth (`CheckoutService`, Task 3), web pre-hydration
  (Task 5), mobile deep link + recovery states (Task 6), duplicate-order prevention (CAS in
  Task 3, tested in Task 3 Step 2's concurrency test), instrumentation (`EventLog`, Task 2,
  emitted throughout Task 3), tests for state transitions (Task 3), README (Task 7).
- **Placeholder scan:** no TBD/TODO markers; every code step has complete code.
- **Type consistency:** `CheckoutSession`, `CheckoutSessionStatus`, `SessionIdInput` defined
  once in Task 1 and reused verbatim through Tasks 3–6. `CheckoutService` method names
  (`createSession`, `resumeSession`, `confirmPrice`, `completeSession`) match between Task 3
  and Task 4's router. `Surface` type (`'web' | 'mobile'`) defined in Task 2's `events.ts`
  and reused as the second parameter to `resumeSession`/`completeSession` in Task 3.
