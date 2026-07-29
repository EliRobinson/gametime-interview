import type { CheckoutSession } from '@repo/api-contracts';
import { formatCurrency } from '@repo/utils';

import { DEMO_EVENT, LISTING_FIXTURES } from '../listings/listings.fixtures';
import { CHECKOUT_COPY } from './checkout.copy';
import type { CheckoutPresentation, CheckoutView } from './checkout.view-model';

const TERMINAL_KINDS = new Set<CheckoutView['kind']>([
  'completed',
  'expired',
  'unavailable',
  'claimed_elsewhere',
  'not_found',
  'error',
]);

/**
 * Joins session commerce state with listing/event fixtures for checkout chrome.
 * Missing fixtures degrade: listing id shown, map/Super Deal/urgency omitted.
 */
export function mapCheckoutPresentation(
  session: CheckoutSession,
  options?: { viewKind?: CheckoutView['kind'] },
): CheckoutPresentation {
  const fixture = LISTING_FIXTURES[session.listingId];
  const viewKind = options?.viewKind;
  const showDecorativeChrome = viewKind === undefined || !TERMINAL_KINDS.has(viewKind);

  const section = fixture?.section ?? null;
  const row = fixture?.row ?? null;
  const seatCount = fixture?.seatCount ?? null;

  const seatLine =
    section && row ? CHECKOUT_COPY.seatLine(section, row) : `Listing ${session.listingId}`;
  const seatLineWeb =
    section && row ? CHECKOUT_COPY.seatLineWeb(section, row) : `Listing ${session.listingId}`;

  const urgencyTicketsLeft = fixture?.urgencyTicketsLeft ?? null;

  return {
    sessionId: session.id,
    listingId: session.listingId,
    status: session.status,
    expiresAt: session.expiresAt,
    totalCents: session.acknowledgedPrice,
    formattedTotal: formatCurrency(session.acknowledgedPrice),
    artist: DEMO_EVENT.artist,
    venue: DEMO_EVENT.venue,
    city: DEMO_EVENT.city,
    datetimeLabel: DEMO_EVENT.datetimeLabel,
    section,
    row,
    seatCount,
    seatLine,
    seatLineWeb,
    seatsTogetherLabel: seatCount !== null ? CHECKOUT_COPY.seatsTogether(seatCount) : null,
    deliveryLabel: CHECKOUT_COPY.mobileTransfer,
    isSuperDeal: fixture?.isSuperDeal ?? false,
    urgencyTicketsLeft,
    urgencyLabel:
      urgencyTicketsLeft !== null ? CHECKOUT_COPY.urgencyTicketsLeft(urgencyTicketsLeft) : null,
    mapBubble: fixture
      ? {
          leftPct: fixture.bubble.leftPct,
          topPct: fixture.bubble.topPct,
          isSuperDeal: fixture.isSuperDeal,
        }
      : null,
    showDecorativeChrome,
  };
}
