import { DEMO_PRICE_CHANGE } from '@repo/api-contracts';

import { FakeInventoryProvider, ListingAlreadyHeldError } from './inventory-provider';

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

  it('rejects placeHold when the listing is already held', async () => {
    const inventory = new FakeInventoryProvider();
    inventory.seedListing('listing_1', 4200);
    await inventory.placeHold('listing_1');

    await expect(inventory.placeHold('listing_1')).rejects.toBeInstanceOf(ListingAlreadyHeldError);
  });

  it('lists seeded prices and marks held listings unavailable', async () => {
    const inventory = new FakeInventoryProvider();
    inventory.seedListing('listing_1', 15400);
    inventory.seedListing('listing_2', 12500);
    await inventory.placeHold('listing_1');

    await expect(inventory.listListings()).resolves.toEqual([
      { listingId: 'listing_1', priceCents: 15400, available: false },
      { listingId: 'listing_2', priceCents: 12500, available: true },
    ]);
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

  describe('demo timed price bump', () => {
    const listingId = DEMO_PRICE_CHANGE.listingId;
    const seedCents = 8900;
    const holdStartedAt = Date.parse('2026-01-01T00:00:00.000Z');

    it('keeps the seeded hold price until the demo delay elapses', async () => {
      let nowMs = holdStartedAt;
      const inventory = new FakeInventoryProvider({ now: () => nowMs });
      inventory.seedListing(listingId, seedCents);

      const { price } = await inventory.placeHold(listingId);
      expect(price).toBe(seedCents);

      nowMs = holdStartedAt + DEMO_PRICE_CHANGE.afterMs - 1;
      await expect(inventory.getHoldStatus(listingId)).resolves.toEqual({
        held: true,
        currentPrice: seedCents,
      });
    });

    it('bumps getHoldStatus price after the demo delay while still held', async () => {
      let nowMs = holdStartedAt;
      const inventory = new FakeInventoryProvider({ now: () => nowMs });
      inventory.seedListing(listingId, seedCents);
      await inventory.placeHold(listingId);

      nowMs = holdStartedAt + DEMO_PRICE_CHANGE.afterMs;
      await expect(inventory.getHoldStatus(listingId)).resolves.toEqual({
        held: true,
        currentPrice: DEMO_PRICE_CHANGE.heldPriceAfterBumpCents,
      });
    });

    it('keeps the catalog list price at the seed even after the hold bumps', async () => {
      let nowMs = holdStartedAt;
      const inventory = new FakeInventoryProvider({ now: () => nowMs });
      inventory.seedListing(listingId, seedCents);
      await inventory.placeHold(listingId);

      nowMs = holdStartedAt + DEMO_PRICE_CHANGE.afterMs;
      const rows = await inventory.listListings();
      expect(rows).toContainEqual({
        listingId,
        priceCents: seedCents,
        available: false,
      });
    });

    it('returns the seeded price again after release and a fresh hold', async () => {
      let nowMs = holdStartedAt;
      const inventory = new FakeInventoryProvider({ now: () => nowMs });
      inventory.seedListing(listingId, seedCents);
      await inventory.placeHold(listingId);

      nowMs = holdStartedAt + DEMO_PRICE_CHANGE.afterMs;
      await inventory.releaseHold(listingId);

      const relisted = await inventory.listListings();
      expect(relisted).toContainEqual({
        listingId,
        priceCents: seedCents,
        available: true,
      });

      const nextHoldStart = holdStartedAt + 60_000;
      nowMs = nextHoldStart;
      const { price } = await inventory.placeHold(listingId);
      expect(price).toBe(seedCents);
      await expect(inventory.getHoldStatus(listingId)).resolves.toEqual({
        held: true,
        currentPrice: seedCents,
      });
    });

    it('does not apply the timed bump to other listings', async () => {
      const inventory = new FakeInventoryProvider({ now: () => holdStartedAt });
      inventory.seedListing('listing_1', 4200);
      await inventory.placeHold('listing_1');

      await expect(inventory.getHoldStatus('listing_1')).resolves.toEqual({
        held: true,
        currentPrice: 4200,
      });
    });
  });
});
