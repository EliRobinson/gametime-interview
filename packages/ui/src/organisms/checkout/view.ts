import type { CheckoutSession } from '@repo/api-contracts';
import { CHECKOUT_ERROR_CODE } from '@repo/api-contracts';

import type { CheckoutView } from './types';

export type { CheckoutView } from './types';

export function viewFromSession(
  session: CheckoutSession,
  notice: string | null = null,
): CheckoutView {
  if (session.status === 'expired') {
    return session.expiryReason === 'hold_released' ? { kind: 'unavailable' } : { kind: 'expired' };
  }
  return { kind: 'session', session, notice };
}

export function viewFromErrorCode(code: string | null, session?: CheckoutSession): CheckoutView {
  switch (code) {
    case CHECKOUT_ERROR_CODE.NOT_FOUND:
      return { kind: 'not_found' };
    case CHECKOUT_ERROR_CODE.TIMEOUT:
      return { kind: 'expired' };
    case CHECKOUT_ERROR_CODE.UNPROCESSABLE_CONTENT:
      return { kind: 'unavailable' };
    case CHECKOUT_ERROR_CODE.PRECONDITION_FAILED:
      return session
        ? { kind: 'price_changed', session }
        : {
            kind: 'error',
            message: 'The price for this listing changed. Reopen your checkout.',
          };
    case CHECKOUT_ERROR_CODE.CONFLICT:
      return { kind: 'claimed_elsewhere' };
    default:
      return { kind: 'error', message: 'Something went wrong on our end. Please try again.' };
  }
}
