import type { CheckoutSessionStatus } from '@repo/api-contracts';

/** Prices cross the wire in cents. */
export function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

const STATUS_LABELS: Record<CheckoutSessionStatus, string> = {
  created: 'Created',
  active: 'Active',
  pending_payment: 'Payment in progress',
  completed: 'Completed',
  expired: 'Expired',
  failed: 'Payment failed',
};

export function statusLabel(status: CheckoutSessionStatus): string {
  return STATUS_LABELS[status];
}
