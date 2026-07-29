import { CHECKOUT_ERROR_CODE } from '@repo/api-contracts';

import {
  priceUpdatedNotice,
  viewFromErrorCode,
  viewFromResume,
  viewFromSession,
} from './mapCheckoutView.util';

const active = {
  id: 'sess_1',
  listingId: 'listing_1',
  status: 'active' as const,
  priceAtCreation: 4200,
  acknowledgedPrice: 4200,
  createdAt: '2026-01-01T00:00:00.000Z',
  expiresAt: '2026-01-01T00:10:00.000Z',
  failureReason: null,
};

describe('viewFromSession', () => {
  it.each([
    {
      name: 'session_lapsed',
      session: { ...active, status: 'expired' as const, expiryReason: 'session_lapsed' as const },
      kind: 'expired',
    },
    {
      name: 'hold_released',
      session: { ...active, status: 'expired' as const, expiryReason: 'hold_released' as const },
      kind: 'unavailable',
    },
    {
      name: 'completed',
      session: { ...active, status: 'completed' as const },
      kind: 'completed',
    },
    {
      name: 'failed',
      session: { ...active, status: 'failed' as const, failureReason: 'card_declined' },
      kind: 'failed',
    },
    {
      name: 'active',
      session: active,
      kind: 'ready',
    },
    {
      name: 'pending_payment',
      session: { ...active, status: 'pending_payment' as const },
      kind: 'processing',
    },
  ])('maps $name', ({ session, kind }) => {
    expect(viewFromSession(session).kind).toBe(kind);
  });
});

describe('viewFromErrorCode', () => {
  it.each([
    { code: CHECKOUT_ERROR_CODE.TIMEOUT, kind: 'expired' },
    { code: CHECKOUT_ERROR_CODE.UNPROCESSABLE_CONTENT, kind: 'unavailable' },
    { code: CHECKOUT_ERROR_CODE.NOT_FOUND, kind: 'not_found' },
    { code: CHECKOUT_ERROR_CODE.CONFLICT, kind: 'claimed_elsewhere' },
  ])('maps $code to $kind', ({ code, kind }) => {
    expect(viewFromErrorCode(code).kind).toBe(kind);
  });

  it('maps PRECONDITION_FAILED to price_changed when session is present', () => {
    expect(viewFromErrorCode(CHECKOUT_ERROR_CODE.PRECONDITION_FAILED, active)).toEqual({
      kind: 'price_changed',
      session: active,
    });
  });
});

describe('viewFromResume', () => {
  it.each([
    {
      name: 'matching live price stays ready',
      livePriceCents: 4200,
      kind: 'ready',
    },
    {
      name: 'diverged live price becomes price_changed',
      livePriceCents: 5000,
      kind: 'price_changed',
    },
    {
      name: 'null live price stays ready',
      livePriceCents: null,
      kind: 'ready',
    },
  ])('$name', ({ livePriceCents, kind }) => {
    const view = viewFromResume(active, livePriceCents);
    expect(view.kind).toBe(kind);
    if (kind === 'price_changed' && view.kind === 'price_changed') {
      expect(view.newPriceCents).toBe(5000);
    }
  });

  it('does not override terminal session status with live price', () => {
    expect(viewFromResume({ ...active, status: 'completed' }, 9999).kind).toBe('completed');
  });
});

describe('priceUpdatedNotice', () => {
  it('formats the confirmed-price notice', () => {
    expect(priceUpdatedNotice(4200)).toBe('Price updated to $42.00.');
  });
});
