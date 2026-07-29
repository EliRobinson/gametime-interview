import {
  isDecorativeSessionStatus,
  isShareableSession,
  sessionFromView,
  showsCheckoutActions,
  showsDecorativeChrome,
} from './checkout.policy.util';
import type { CheckoutView } from './checkout.view-model';

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

describe('checkout.policy', () => {
  it.each([
    { status: 'active' as const, decorative: true },
    { status: 'failed' as const, decorative: true },
    { status: 'completed' as const, decorative: false },
    { status: 'expired' as const, decorative: false },
    { status: 'pending_payment' as const, decorative: false },
  ])('isDecorativeSessionStatus($status) → $decorative', ({ status, decorative }) => {
    expect(isDecorativeSessionStatus(status)).toBe(decorative);
  });

  it.each([
    { kind: 'ready' as const, shows: true },
    { kind: 'price_changed' as const, shows: true },
    { kind: 'failed' as const, shows: true },
    { kind: 'completed' as const, shows: false },
    { kind: 'processing' as const, shows: false },
  ])('showsCheckoutActions($kind) → $shows', ({ kind, shows }) => {
    const view = { kind, session: active } as CheckoutView;
    expect(showsCheckoutActions(view)).toBe(shows);
  });

  it.each([
    { kind: 'ready' as const, shows: true },
    { kind: 'completed' as const, shows: false },
    { kind: undefined, shows: true },
  ])('showsDecorativeChrome($kind) → $shows', ({ kind, shows }) => {
    expect(showsDecorativeChrome(kind)).toBe(shows);
  });

  it('sessionFromView returns the session when present', () => {
    expect(sessionFromView({ kind: 'ready', session: active, notice: null })).toBe(active);
    expect(sessionFromView({ kind: 'loading' })).toBeNull();
  });

  it('isShareableSession matches active and failed only', () => {
    expect(isShareableSession(active)).toBe(true);
    expect(isShareableSession({ ...active, status: 'failed' })).toBe(true);
    expect(isShareableSession({ ...active, status: 'completed' })).toBe(false);
  });
});
