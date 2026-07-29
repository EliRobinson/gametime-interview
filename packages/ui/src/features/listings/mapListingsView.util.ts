import type { ListingAvailability } from '@repo/api-contracts';
import { formatCurrency } from '@repo/utils';

import { DEMO_EVENT, LISTING_FIXTURES } from './listings.fixtures';
import type { SelectionViewModel } from './listings.view-model';

/**
 * Merge presentation fixtures with live API rows. Unknown / unseeded API ids
 * are omitted; fixture-only ids without an API row are omitted too.
 */
export function mapListingsView(apiListings: ListingAvailability[]): SelectionViewModel {
  const listings = apiListings.flatMap((row) => {
    const fixture = LISTING_FIXTURES[row.listingId];
    if (!fixture) return [];
    return [
      {
        ...fixture,
        priceCents: row.priceCents,
        available: row.available,
        formattedPrice: formatCurrency(row.priceCents),
      },
    ];
  });

  return { event: DEMO_EVENT, listings };
}
