import type { CheckoutSession } from '@repo/api-contracts';
import { render, screen } from '@testing-library/react-native';

import { mapCheckoutPresentation } from './mapCheckoutPresentation.util';
import { PriceBreakdown } from './PriceBreakdown';

const baseSession: CheckoutSession = {
  id: 'sess_1',
  listingId: 'listing_3',
  status: 'active',
  priceAtCreation: 8900,
  acknowledgedPrice: 8900,
  createdAt: '2026-01-01T00:00:00.000Z',
  expiresAt: '2026-01-01T00:10:00.000Z',
  failureReason: null,
};

describe('PriceBreakdown', () => {
  it('shows unit price on Tickets and unit × seats as Total', () => {
    const presentation = mapCheckoutPresentation(baseSession);

    render(<PriceBreakdown presentation={presentation} />);

    expect(screen.getByText('$89.00 · 3 seats')).toBeTruthy();
    expect(screen.getByText('$267.00')).toBeTruthy();
    expect(screen.queryByTestId('previous-unit-price')).toBeNull();
  });

  it('strikes through the previous unit price only when provided after confirm', () => {
    const presentation = mapCheckoutPresentation(
      { ...baseSession, acknowledgedPrice: 10900 },
      { previousUnitPriceCents: 8900 },
    );

    render(<PriceBreakdown presentation={presentation} />);

    expect(screen.getByTestId('previous-unit-price')).toBeTruthy();
    expect(screen.getByText('$89.00')).toBeTruthy();
    expect(screen.getByText('$109.00 · 3 seats')).toBeTruthy();
    expect(screen.getByText('$327.00')).toBeTruthy();
  });
});
