import { DEMO_PRICE_CHANGE, msUntilDemoPriceBump } from './demo-price-change';

describe('msUntilDemoPriceBump', () => {
  const createdAt = '2026-01-01T00:00:00.000Z';
  const createdAtMs = Date.parse(createdAt);

  test.each([
    {
      name: 'null for non-demo listings',
      listingId: 'listing_1',
      nowMs: createdAtMs + 60_000,
      expected: null,
    },
    {
      name: 'full delay right after create',
      listingId: DEMO_PRICE_CHANGE.listingId,
      nowMs: createdAtMs,
      expected: DEMO_PRICE_CHANGE.afterMs,
    },
    {
      name: 'remaining delay mid-window',
      listingId: DEMO_PRICE_CHANGE.listingId,
      nowMs: createdAtMs + DEMO_PRICE_CHANGE.afterMs / 2,
      expected: DEMO_PRICE_CHANGE.afterMs / 2,
    },
    {
      name: 'zero once the bump is due',
      listingId: DEMO_PRICE_CHANGE.listingId,
      nowMs: createdAtMs + DEMO_PRICE_CHANGE.afterMs,
      expected: 0,
    },
    {
      name: 'zero when past the bump window',
      listingId: DEMO_PRICE_CHANGE.listingId,
      nowMs: createdAtMs + DEMO_PRICE_CHANGE.afterMs + 5_000,
      expected: 0,
    },
    {
      name: 'null once the fan already acknowledged the bumped price',
      listingId: DEMO_PRICE_CHANGE.listingId,
      nowMs: createdAtMs + DEMO_PRICE_CHANGE.afterMs + 5_000,
      acknowledgedPrice: DEMO_PRICE_CHANGE.heldPriceAfterBumpCents,
      expected: null,
    },
  ])('$name', ({ listingId, nowMs, expected, acknowledgedPrice }) => {
    expect(msUntilDemoPriceBump({ listingId, createdAt, acknowledgedPrice }, nowMs)).toBe(expected);
  });
});
