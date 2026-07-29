import { listingAvailabilitySchema,listListingsOutput } from './listings';

describe('listings schemas', () => {
  it.each([
    {
      name: 'accepts an available listing row',
      row: { listingId: 'listing_1', priceCents: 15400, available: true },
      success: true,
    },
    {
      name: 'rejects a missing listingId',
      row: { priceCents: 15400, available: true },
      success: false,
    },
    {
      name: 'rejects a negative price',
      row: { listingId: 'listing_1', priceCents: -1, available: true },
      success: false,
    },
  ])('$name', ({ row, success }) => {
    expect(listingAvailabilitySchema.safeParse(row).success).toBe(success);
  });

  it('accepts a list payload', () => {
    const result = listListingsOutput.safeParse({
      listings: [{ listingId: 'listing_1', priceCents: 15400, available: true }],
    });
    expect(result.success).toBe(true);
  });
});
