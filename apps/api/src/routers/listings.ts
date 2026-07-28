import { listListingsOutput } from '@repo/api-contracts';

import { publicProcedure, router } from '../trpc';

export const listingsRouter = router({
  list: publicProcedure.output(listListingsOutput).query(async ({ ctx }) => ({
    listings: await ctx.inventory.listListings(),
  })),
});
