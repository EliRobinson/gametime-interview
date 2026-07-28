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

  it('distinguishes a lapsed session clock from a released inventory hold', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
    try {
      const { service, inventory } = setup();

      const lapsing = await service.createSession('listing_1');
      const held = await service.createSession('listing_1');

      // One session outlives its own clock while the hold is still good...
      jest.setSystemTime(new Date('2026-01-01T00:11:00.000Z'));
      const lapsed = await service.resumeSession(lapsing.id, 'web');

      // ...the other is still within its clock but the hold went away.
      jest.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
      inventory.releaseListing('listing_1');
      const dropped = await service.resumeSession(held.id, 'web');

      expect(lapsed.status).toBe('expired');
      expect(lapsed.expiryReason).toBe('session_lapsed');
      expect(dropped.status).toBe('expired');
      expect(dropped.expiryReason).toBe('hold_released');
    } finally {
      jest.useRealTimers();
    }
  });

  it('refuses to charge a session another surface has already claimed', async () => {
    const { store, inventory, events } = setup();
    const charged: string[] = [];
    const payment = {
      charge: async (sessionId: string) => {
        charged.push(sessionId);
        return 'succeeded' as const;
      },
    };
    const service = new CheckoutService(store, inventory, payment, events);
    const session = await service.createSession('listing_1');

    // Device A claimed the session and then stalled mid-charge (slow provider,
    // dropped connection, crashed process) — the session sits in pending_payment.
    store.casUpdate(session.id, 'active', (s) => ({ ...s, status: 'pending_payment' }));

    await expect(service.completeSession(session.id, 'mobile')).rejects.toThrow(ConflictError);
    // The guard has to run before the provider call, not just leave the status alone.
    expect(charged).toHaveLength(0);
  });

  it('refuses to reconfirm a price on an expired session', async () => {
    const { service, store } = setup();
    const session = await service.createSession('listing_1');
    store.casUpdate(session.id, 'active', (s) => ({ ...s, status: 'expired' }));

    await expect(service.confirmPrice(session.id)).rejects.toThrow(SessionExpiredError);
  });

  it('leaves a completed order untouched when confirmPrice is replayed', async () => {
    const { service, inventory } = setup();
    const session = await service.createSession('listing_1');
    const completed = await service.completeSession(session.id, 'web');
    expect(completed.status).toBe('completed');

    inventory.setPrice('listing_1', 9900);
    const replayed = await service.confirmPrice(session.id);

    expect(replayed.status).toBe('completed');
    expect(replayed.acknowledgedPrice).toBe(4200);
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
