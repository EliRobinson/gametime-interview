import { z } from 'zod';

export const listingAvailabilitySchema = z.object({
  listingId: z.string().min(1),
  priceCents: z.number().nonnegative(),
  available: z.boolean(),
});
export type ListingAvailability = z.infer<typeof listingAvailabilitySchema>;

export const listListingsOutput = z.object({
  listings: z.array(listingAvailabilitySchema),
});
export type ListListingsOutput = z.infer<typeof listListingsOutput>;
