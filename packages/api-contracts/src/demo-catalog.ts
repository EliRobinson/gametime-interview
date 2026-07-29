/**
 * Single demo catalog shared by API inventory seeding and UI presentation
 * fixtures. Prices are commerce truth; section/row/map fields are presentation.
 */
export const DEMO_EVENT = {
  artist: 'Ed Sheeran',
  venue: 'Lumen Field',
  datetimeLabel: 'Sat 8/1 at 5:30 PM',
  city: 'Seattle',
} as const;

export type DemoListing = {
  listingId: string;
  priceCents: number;
  section: string;
  row: string;
  seatCount: number;
  isSuperDeal: boolean;
  bubble: { leftPct: number; topPct: number };
  urgencyTicketsLeft?: number;
};

export const DEMO_CATALOG: readonly DemoListing[] = [
  {
    listingId: 'listing_1',
    priceCents: 15400,
    section: '309',
    row: 'JJ',
    seatCount: 2,
    isSuperDeal: true,
    bubble: { leftPct: 62, topPct: 28 },
    urgencyTicketsLeft: 4,
  },
  {
    listingId: 'listing_2',
    priceCents: 12500,
    section: '204',
    row: '12',
    seatCount: 2,
    isSuperDeal: true,
    bubble: { leftPct: 38, topPct: 42 },
  },
  {
    listingId: 'listing_3',
    priceCents: 8900,
    // Visible after the row so reviewers can spot the timed demo ticket.
    section: '118',
    row: '8 · 10s price demo',
    seatCount: 3,
    isSuperDeal: false,
    bubble: { leftPct: 55, topPct: 58 },
  },
  {
    listingId: 'listing_4',
    priceCents: 21000,
    section: '332',
    row: 'A',
    seatCount: 2,
    isSuperDeal: false,
    bubble: { leftPct: 72, topPct: 48 },
  },
  {
    listingId: 'listing_5',
    priceCents: 167600,
    section: 'Floor',
    row: '1',
    seatCount: 2,
    isSuperDeal: false,
    bubble: { leftPct: 28, topPct: 52 },
  },
] as const;
