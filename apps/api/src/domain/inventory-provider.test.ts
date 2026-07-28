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
});
