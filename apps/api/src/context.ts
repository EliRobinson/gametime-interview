import { PrismaClient } from '@prisma/client';
import type { CreateUserInput, User } from '@repo/api-contracts';
import type { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify';

import { CheckoutService } from './domain/checkout-service';
import { EventLog } from './domain/events';
import type { InventoryProvider } from './domain/inventory-provider';
import { FakeInventoryProvider } from './domain/inventory-provider';
import { FakePaymentProvider } from './domain/payment-provider';
import { InMemorySessionStore } from './domain/session-store';

const prisma = new PrismaClient();

export type UserStore = {
  list: () => Promise<User[]>;
  create: (input: CreateUserInput) => Promise<User>;
};

export type Context = {
  userId: string | null;
  users: UserStore;
  checkout: CheckoutService;
  inventory: InventoryProvider;
};

function createPrismaUserStore(client: PrismaClient): UserStore {
  return {
    list: () => client.user.findMany(),
    create: (input) => client.user.create({ data: input }),
  };
}

// Checkout state lives in memory for this prototype: one process-wide service
// so a session created on one surface is resumable from another.
const checkoutStore = new InMemorySessionStore();
const inventoryProvider = new FakeInventoryProvider();
const paymentProvider = new FakePaymentProvider();
const eventLog = new EventLog();

// Demo catalog — presentation fixtures in @repo/ui key off these listing ids.
const DEMO_LISTINGS: Array<{ listingId: string; priceCents: number }> = [
  { listingId: 'listing_1', priceCents: 15400 },
  { listingId: 'listing_2', priceCents: 12500 },
  { listingId: 'listing_3', priceCents: 8900 },
  { listingId: 'listing_4', priceCents: 21000 },
  { listingId: 'listing_5', priceCents: 167600 },
];

for (const listing of DEMO_LISTINGS) {
  inventoryProvider.seedListing(listing.listingId, listing.priceCents);
}

const checkoutService = new CheckoutService(
  checkoutStore,
  inventoryProvider,
  paymentProvider,
  eventLog,
);

// Wire up your auth provider (e.g. Clerk) here to populate userId.
export function createContext({ req: _req }: CreateFastifyContextOptions): Context {
  return {
    userId: null,
    users: createPrismaUserStore(prisma),
    checkout: checkoutService,
    inventory: inventoryProvider,
  };
}
