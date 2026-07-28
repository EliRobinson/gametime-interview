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
