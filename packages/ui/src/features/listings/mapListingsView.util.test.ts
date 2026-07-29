import { mapListingsView } from './mapListingsView.util';

describe('mapListingsView', () => {
  it('merges fixture presentation with API price and availability', () => {
    const view = mapListingsView([
      { listingId: 'listing_1', priceCents: 15400, available: true },
      { listingId: 'listing_2', priceCents: 12500, available: false },
    ]);

    expect(view.event.artist).toBe('Ed Sheeran');
    expect(view.listings).toEqual([
      expect.objectContaining({
        listingId: 'listing_1',
        section: '309',
        row: 'JJ',
        isSuperDeal: true,
        priceCents: 15400,
        available: true,
        formattedPrice: '$154.00',
      }),
      expect.objectContaining({
        listingId: 'listing_2',
        available: false,
        priceCents: 12500,
      }),
    ]);
  });

  it('omits API rows without a presentation fixture', () => {
    const view = mapListingsView([
      { listingId: 'listing_unknown', priceCents: 1000, available: true },
    ]);

    expect(view.listings).toEqual([]);
  });
});
