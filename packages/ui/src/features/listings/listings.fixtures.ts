import type { DemoListing } from '@repo/api-contracts';
import { DEMO_CATALOG, DEMO_EVENT as SHARED_DEMO_EVENT } from '@repo/api-contracts';

import type { EventFixture, ListingFixture } from './listings.view-model';

export const DEMO_EVENT: EventFixture = { ...SHARED_DEMO_EVENT };

function toListingFixture(listing: DemoListing): ListingFixture {
  return {
    listingId: listing.listingId,
    section: listing.section,
    row: listing.row,
    seatCount: listing.seatCount,
    isSuperDeal: listing.isSuperDeal,
    bubble: listing.bubble,
    ...(listing.urgencyTicketsLeft !== undefined
      ? { urgencyTicketsLeft: listing.urgencyTicketsLeft }
      : {}),
  };
}

/**
 * Presentation-only catalog keyed by API listing ids. Prices and availability
 * come from `listings.list` — these fixtures never invent commerce state.
 * Source of truth for ids + presentation fields: `@repo/api-contracts` DEMO_CATALOG.
 */
export const LISTING_FIXTURES: Record<string, ListingFixture> = Object.fromEntries(
  DEMO_CATALOG.map((listing) => [listing.listingId, toListingFixture(listing)]),
);
