import { checkoutSessionSchema, createSessionInput, sessionIdInput } from './checkout';

describe('checkout schemas', () => {
  it('accepts a valid checkout session', () => {
    const result = checkoutSessionSchema.safeParse({
      id: 'sess_abc123',
      listingId: 'listing_1',
      status: 'active',
      priceAtCreation: 4200,
      acknowledgedPrice: 4200,
      createdAt: '2026-01-01T00:00:00.000Z',
      expiresAt: '2026-01-01T00:10:00.000Z',
      failureReason: null,
    });
    expect(result.success).toBe(true);
  });

  it('rejects an unknown status', () => {
    const result = checkoutSessionSchema.safeParse({
      id: 'sess_abc123',
      listingId: 'listing_1',
      status: 'bogus',
      priceAtCreation: 4200,
      acknowledgedPrice: 4200,
      createdAt: '2026-01-01T00:00:00.000Z',
      expiresAt: '2026-01-01T00:10:00.000Z',
      failureReason: null,
    });
    expect(result.success).toBe(false);
  });

  it('createSessionInput requires a listingId', () => {
    expect(createSessionInput.safeParse({}).success).toBe(false);
    expect(createSessionInput.safeParse({ listingId: 'listing_1' }).success).toBe(true);
  });

  it('sessionIdInput requires a sessionId', () => {
    expect(sessionIdInput.safeParse({}).success).toBe(false);
    expect(sessionIdInput.safeParse({ sessionId: 'sess_abc123' }).success).toBe(true);
  });
});
