import type { CheckoutSessionStatus } from '@repo/api-contracts';

const STATUS_LABELS: Record<CheckoutSessionStatus, string> = {
  active: 'Active',
  pending_payment: 'Payment in progress',
  completed: 'Completed',
  expired: 'Expired',
  failed: 'Payment failed',
};

export function statusLabel(status: CheckoutSessionStatus): string {
  return STATUS_LABELS[status];
}
