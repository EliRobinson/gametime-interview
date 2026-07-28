import type { CheckoutSession } from '@repo/api-contracts';

export type CheckoutView =
  | { kind: 'loading' }
  | { kind: 'session'; session: CheckoutSession; notice: string | null }
  | { kind: 'price_changed'; session: CheckoutSession; newPriceCents?: number }
  | { kind: 'expired' }
  | { kind: 'unavailable' }
  | { kind: 'claimed_elsewhere' }
  | { kind: 'not_found' }
  | { kind: 'error'; message: string };
