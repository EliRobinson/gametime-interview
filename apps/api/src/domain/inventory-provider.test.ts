import { FakeInventoryProvider } from './inventory-provider';

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
