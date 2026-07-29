import type { CheckoutSession } from '@repo/api-contracts';

/**
 * UI-facing checkout states. Apps map API sessions / errors into this union;
 * `CheckoutCard` renders from it without re-branching on domain `status`.
 */
export type CheckoutView =
  | { kind: 'loading' }
  | { kind: 'ready'; session: CheckoutSession; notice: string | null }
  | { kind: 'completed'; session: CheckoutSession }
  | { kind: 'failed'; session: CheckoutSession }
  | { kind: 'price_changed'; session: CheckoutSession; newPriceCents?: number }
  | { kind: 'expired' }
  | { kind: 'unavailable' }
  | { kind: 'claimed_elsewhere' }
  | { kind: 'not_found' }
  | { kind: 'error'; message: string };

export type CheckoutMapBubble = {
  leftPct: number;
  topPct: number;
  isSuperDeal: boolean;
};

/**
 * Presentation join of session commerce fields + listing/event fixtures.
 * Apps compose shared presentational blocks from this; never invent price math.
 */
export type CheckoutPresentation = {
  sessionId: string;
  listingId: string;
  status: CheckoutSession['status'];
  expiresAt: string;
  /** Listing total in cents — same value for line item and Total. */
  totalCents: number;
  formattedTotal: string;
  artist: string;
  venue: string;
  city: string;
  datetimeLabel: string;
  section: string | null;
  row: string | null;
  seatCount: number | null;
  seatLine: string;
  seatLineWeb: string;
  seatsTogetherLabel: string | null;
  deliveryLabel: string;
  isSuperDeal: boolean;
  urgencyTicketsLeft: number | null;
  urgencyLabel: string | null;
  mapBubble: CheckoutMapBubble | null;
  showDecorativeChrome: boolean;
};
