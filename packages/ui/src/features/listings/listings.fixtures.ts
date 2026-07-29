import type { EventFixture, ListingFixture } from './listings.view-model';

export const DEMO_EVENT: EventFixture = {
  artist: 'Ed Sheeran',
  venue: 'Lumen Field',
  datetimeLabel: 'Sat 8/1 at 5:30 PM',
  city: 'Seattle',
};

/**
 * Presentation-only catalog keyed by API listing ids. Prices and availability
 * come from `listings.list` — these fixtures never invent commerce state.
 */
export const LISTING_FIXTURES: Record<string, ListingFixture> = {
  listing_1: {
    listingId: 'listing_1',
    section: '309',
    row: 'JJ',
    seatCount: 2,
    isSuperDeal: true,
    bubble: { leftPct: 62, topPct: 28 },
    urgencyTicketsLeft: 4,
  },
  listing_2: {
    listingId: 'listing_2',
    section: '204',
    row: '12',
    seatCount: 2,
    isSuperDeal: true,
    bubble: { leftPct: 38, topPct: 42 },
  },
  listing_3: {
    listingId: 'listing_3',
    section: '118',
    row: '8',
    seatCount: 3,
    isSuperDeal: false,
    bubble: { leftPct: 55, topPct: 58 },
  },
  listing_4: {
    listingId: 'listing_4',
    section: '332',
    row: 'A',
    seatCount: 2,
    isSuperDeal: false,
    bubble: { leftPct: 72, topPct: 48 },
  },
  listing_5: {
    listingId: 'listing_5',
    section: 'Floor',
    row: '1',
    seatCount: 2,
    isSuperDeal: false,
    bubble: { leftPct: 28, topPct: 52 },
  },
};
