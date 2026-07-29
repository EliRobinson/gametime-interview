import type { CheckoutSession } from '@repo/api-contracts';

/**
 * UI-facing checkout states. Apps map API sessions / errors into this union;
 * `CheckoutCard` renders from it without re-branching on domain `status`.
 */
export type CheckoutView =
  | { kind: 'loading' }
  | {
      kind: 'ready';
      session: CheckoutSession;
      notice: string | null;
      /** Prior per-ticket cents after the fan confirms a bump — drives strikethrough. */
      previousUnitPriceCents?: number;
    }
  | { kind: 'completed'; session: CheckoutSession }
  | { kind: 'failed'; session: CheckoutSession }
  | { kind: 'price_changed'; session: CheckoutSession; newPriceCents?: number }
  /** Session is claimed for charge — no Buy CTA (this device or another). */
  | { kind: 'processing'; session: CheckoutSession }
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
  /** Per-ticket price currently acknowledged, in cents. */
  unitPriceCents: number;
  formattedUnitPrice: string;
  /**
   * Prior per-ticket cents after confirm — when set, Tickets shows strikethrough
   * then the new unit price. Omitted while the fan is still deciding on a bump.
   */
  previousUnitPriceCents: number | null;
  formattedPreviousUnitPrice: string | null;
  /** Order total in cents: unit price × seat count (or unit price when seats unknown). */
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
