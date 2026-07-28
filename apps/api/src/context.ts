import { PrismaClient } from '@prisma/client';
import type { CreateUserInput, User } from '@repo/api-contracts';
import type { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify';

import { CheckoutService } from './domain/checkout-service';
import { EventLog } from './domain/events';
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
// Demo seed data — replace with a real catalog lookup when wiring a real inventory system.
inventoryProvider.seedListing('listing_1', 4200);
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
  };
}
