import type { CheckoutSession } from '@repo/api-contracts';

import { CHECKOUT_COPY } from './checkout.copy';
import { mapCheckoutPresentation } from './mapCheckoutPresentation.util';

const baseSession: CheckoutSession = {
  id: 'sess_1',
  listingId: 'listing_1',
  status: 'active',
  priceAtCreation: 15400,
  acknowledgedPrice: 15400,
  createdAt: '2026-01-01T00:00:00.000Z',
  expiresAt: '2026-01-01T00:10:00.000Z',
  failureReason: null,
};

describe('mapCheckoutPresentation', () => {
  it.each([
    {
      name: 'joins listing_1 fixture with Super Deal and urgency',
      listingId: 'listing_1',
      expected: {
        section: '309',
        row: 'JJ',
        seatCount: 2,
        isSuperDeal: true,
        urgencyTicketsLeft: 4,
        hasMapBubble: true,
        totalCents: 30800,
        formattedTotal: '$308.00',
      },
    },
    {
      name: 'joins listing_3 without Super Deal or urgency',
      listingId: 'listing_3',
      expected: {
        section: '118',
        row: '8 · 10s price demo',
        seatCount: 3,
        isSuperDeal: false,
        urgencyTicketsLeft: null,
        hasMapBubble: true,
        totalCents: 46200,
        formattedTotal: '$462.00',
      },
    },
    {
      name: 'degrades gracefully when fixture is missing',
      listingId: 'listing_missing',
      expected: {
        section: null,
        row: null,
        seatCount: null,
        isSuperDeal: false,
        urgencyTicketsLeft: null,
        hasMapBubble: false,
        totalCents: 15400,
        formattedTotal: '$154.00',
      },
    },
  ])('$name', ({ listingId, expected }) => {
    const presentation = mapCheckoutPresentation({ ...baseSession, listingId });

    expect(presentation.section).toBe(expected.section);
    expect(presentation.row).toBe(expected.row);
    expect(presentation.seatCount).toBe(expected.seatCount);
    expect(presentation.isSuperDeal).toBe(expected.isSuperDeal);
    expect(presentation.urgencyTicketsLeft).toBe(expected.urgencyTicketsLeft);
    expect(presentation.mapBubble !== null).toBe(expected.hasMapBubble);
    expect(presentation.unitPriceCents).toBe(15400);
    expect(presentation.formattedUnitPrice).toBe('$154.00');
    expect(presentation.formattedTotal).toBe(expected.formattedTotal);
    expect(presentation.totalCents).toBe(expected.totalCents);
    expect(presentation.artist).toBe('Ed Sheeran');
    expect(presentation.venue).toBe('Lumen Field');
  });

  it('multiplies unit price by seat count for the order total', () => {
    const presentation = mapCheckoutPresentation(baseSession);

    expect(presentation.formattedUnitPrice).toBe('$154.00');
    expect(presentation.seatCount).toBe(2);
    expect(presentation.formattedTotal).toBe('$308.00');
    expect(presentation.totalCents).toBe(30800);
  });

  it('exposes previous unit price only when provided after confirm', () => {
    const withoutPrevious = mapCheckoutPresentation(baseSession);
    expect(withoutPrevious.previousUnitPriceCents).toBeNull();
    expect(withoutPrevious.formattedPreviousUnitPrice).toBeNull();

    const withPrevious = mapCheckoutPresentation(
      { ...baseSession, acknowledgedPrice: 10900 },
      { previousUnitPriceCents: 8900 },
    );
    expect(withPrevious.previousUnitPriceCents).toBe(8900);
    expect(withPrevious.formattedPreviousUnitPrice).toBe('$89.00');
    expect(withPrevious.formattedUnitPrice).toBe('$109.00');
  });

  it('builds urgency label from fixture count', () => {
    const presentation = mapCheckoutPresentation(baseSession);

    expect(presentation.urgencyLabel).toBe(CHECKOUT_COPY.urgencyTicketsLeft(4));
  });

  it.each([
    { viewKind: 'ready' as const, showDecorativeChrome: true },
    { viewKind: 'price_changed' as const, showDecorativeChrome: true },
    { viewKind: 'failed' as const, showDecorativeChrome: true },
    { viewKind: 'completed' as const, showDecorativeChrome: false },
    { viewKind: 'expired' as const, showDecorativeChrome: false },
    { viewKind: 'unavailable' as const, showDecorativeChrome: false },
    { viewKind: 'processing' as const, showDecorativeChrome: false },
    { viewKind: 'error' as const, showDecorativeChrome: false },
  ])(
    'sets showDecorativeChrome=$showDecorativeChrome for $viewKind',
    ({ viewKind, showDecorativeChrome }) => {
      const presentation = mapCheckoutPresentation(baseSession, { viewKind });
      expect(presentation.showDecorativeChrome).toBe(showDecorativeChrome);
    },
  );
});
