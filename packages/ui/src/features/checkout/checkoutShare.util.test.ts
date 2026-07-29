import {
  buildCheckoutShareUrls,
  buildNativeSharePayload,
  isShareableSession,
} from './checkoutShare.util';

describe('checkoutShare', () => {
  it.each([
    { status: 'created' as const, shareable: true },
    { status: 'active' as const, shareable: true },
    { status: 'failed' as const, shareable: true },
    { status: 'completed' as const, shareable: false },
    { status: 'expired' as const, shareable: false },
    { status: 'pending_payment' as const, shareable: false },
  ])('isShareableSession($status) → $shareable', ({ status, shareable }) => {
    expect(
      isShareableSession({
        id: 'sess_1',
        listingId: 'listing_1',
        status,
        priceAtCreation: 4200,
        acknowledgedPrice: 4200,
        createdAt: '2026-01-01T00:00:00.000Z',
        expiresAt: '2026-01-01T00:10:00.000Z',
        failureReason: null,
      }),
    ).toBe(shareable);
  });

  it('builds web and mobile resume URLs from the session id', () => {
    expect(buildCheckoutShareUrls('sess_abc', 'http://localhost:3001/')).toEqual({
      shareWebUrl: 'http://localhost:3001/checkout/sess_abc',
      shareMobileUrl: 'mobileweb://checkout/sess_abc',
    });
  });

  it('puts the web URL in message only so iOS Copy pastes a link (not empty clipboard)', () => {
    // iOS Share with only `url` leaves Copy empty; message+url shows "2 Links".
    expect(buildNativeSharePayload('http://localhost:3001/checkout/sess_abc')).toEqual({
      message: 'http://localhost:3001/checkout/sess_abc',
    });
  });
});
