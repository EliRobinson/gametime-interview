import type { User } from '@repo/api-contracts';

import type { Context, UserStore } from './context';
import { CheckoutService } from './domain/checkout-service';
import { EventLog } from './domain/events';
import { FakeInventoryProvider } from './domain/inventory-provider';
import { FakePaymentProvider } from './domain/payment-provider';
import { InMemorySessionStore } from './domain/session-store';
import { appRouter } from './router';

const sampleUser: User = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'a@example.com',
  name: 'Ada',
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
};

function createCaller(users: UserStore) {
  const inventory = new FakeInventoryProvider();
  const checkout = new CheckoutService(
    new InMemorySessionStore(),
    inventory,
    new FakePaymentProvider(),
    new EventLog(),
  );
  const ctx: Context = { userId: null, users, checkout, inventory };
  return appRouter.createCaller(ctx);
}

describe('appRouter', () => {
  it('health check reports ok', async () => {
    const caller = createCaller({
      list: jest.fn(),
      create: jest.fn(),
    });

    await expect(caller.health()).resolves.toMatchObject({ ok: true });
  });

  it.each([
    {
      name: 'lists users from the user store',
      run: async (users: UserStore) => createCaller(users).users.list(),
      users: {
        list: jest.fn().mockResolvedValue([sampleUser]),
        create: jest.fn(),
      },
      expected: [sampleUser],
      assertStore: (users: UserStore) => {
        expect(users.list).toHaveBeenCalledTimes(1);
        expect(users.create).not.toHaveBeenCalled();
      },
    },
    {
      name: 'creates a user through the user store',
      run: async (users: UserStore) =>
        createCaller(users).users.create({ email: sampleUser.email, name: sampleUser.name }),
      users: {
        list: jest.fn(),
        create: jest.fn().mockResolvedValue(sampleUser),
      },
      expected: sampleUser,
      assertStore: (users: UserStore) => {
        expect(users.create).toHaveBeenCalledWith({
          email: sampleUser.email,
          name: sampleUser.name,
        });
        expect(users.list).not.toHaveBeenCalled();
      },
    },
  ])('$name', async ({ run, users, expected, assertStore }) => {
    await expect(run(users)).resolves.toEqual(expected);
    assertStore(users);
  });
});

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
    inventory,
  };
  return { caller: appRouter.createCaller(ctx), inventory, payment, events };
}

describe('appRouter.listings', () => {
  it('returns seeded prices and marks held listings unavailable', async () => {
    const { caller, inventory } = createCheckoutCaller();
    inventory.seedListing('listing_2', 12500);
    await inventory.placeHold('listing_1');

    await expect(caller.listings.list()).resolves.toEqual({
      listings: [
        { listingId: 'listing_1', priceCents: 4200, available: false },
        { listingId: 'listing_2', priceCents: 12500, available: true },
      ],
    });
  });

  it('surfaces create failure when a listing is already held', async () => {
    const { caller } = createCheckoutCaller();
    await caller.checkout.create({ listingId: 'listing_1' });

    await expect(caller.checkout.create({ listingId: 'listing_1' })).rejects.toMatchObject({
      code: 'UNPROCESSABLE_CONTENT',
    });
  });
});

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

  it('distinguishes a released inventory hold from a duplicate completion', async () => {
    const { caller, inventory } = createCheckoutCaller();
    const created = await caller.checkout.create({ listingId: 'listing_1' });
    inventory.releaseListing('listing_1');

    await expect(caller.checkout.complete({ sessionId: created.id })).rejects.toMatchObject({
      code: 'UNPROCESSABLE_CONTENT',
    });
  });

  it('returns TIMEOUT when completing a session whose own clock has lapsed', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
    try {
      const { caller } = createCheckoutCaller();
      const created = await caller.checkout.create({ listingId: 'listing_1' });

      jest.setSystemTime(new Date('2026-01-01T00:11:00.000Z'));

      await expect(caller.checkout.complete({ sessionId: created.id })).rejects.toMatchObject({
        code: 'TIMEOUT',
      });
    } finally {
      jest.useRealTimers();
    }
  });

  it('records the reporting surface on the event log', async () => {
    const { caller, events } = createCheckoutCaller();
    const created = await caller.checkout.create({ listingId: 'listing_1' });

    await caller.checkout.resume({ sessionId: created.id, surface: 'mobile' });
    await caller.checkout.complete({ sessionId: created.id, surface: 'mobile' });

    const resumedEvent = events.all().find((e) => e.name === 'session_resumed');
    const completedEvent = events.all().find((e) => e.name === 'session_completed');
    expect(resumedEvent?.toSurface).toBe('mobile');
    expect(completedEvent?.surface).toBe('mobile');
  });
});
