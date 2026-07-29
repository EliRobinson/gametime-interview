import { createUserInput, userSchema } from '@repo/api-contracts';
import { z } from 'zod';

import { checkoutRouter } from './routers/checkout';
import { listingsRouter } from './routers/listings';
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
  listings: listingsRouter,
});

export type AppRouter = typeof appRouter;
