export type BubblePosition = {
  /** Percent from left edge of the map (0–100). */
  leftPct: number;
  /** Percent from top edge of the map (0–100). */
  topPct: number;
};

export type EventFixture = {
  artist: string;
  venue: string;
  datetimeLabel: string;
  city: string;
};

export type ListingFixture = {
  listingId: string;
  section: string;
  row: string;
  seatCount: number;
  isSuperDeal: boolean;
  bubble: BubblePosition;
  urgencyTicketsLeft?: number;
};

export type ListingRowView = ListingFixture & {
  priceCents: number;
  available: boolean;
  formattedPrice: string;
};

export type SelectionViewModel = {
  event: EventFixture;
  listings: ListingRowView[];
};
