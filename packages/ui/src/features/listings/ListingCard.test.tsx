import { fireEvent, render, screen } from '@testing-library/react-native';

import { ListingCard } from './ListingCard';
import type { ListingRowView } from './listings.view-model';

const longDemoListing: ListingRowView = {
  listingId: 'listing_3',
  section: '118',
  row: '8 · 10s price demo',
  seatCount: 3,
  isSuperDeal: false,
  bubble: { leftPct: 55, topPct: 58 },
  priceCents: 8900,
  available: true,
  formattedPrice: '$89.00',
};

describe('ListingCard', () => {
  it('keeps the full price visible when the seat label is long', () => {
    render(<ListingCard listing={longDemoListing} selected={false} onSelect={jest.fn()} />);

    expect(screen.getByTestId('listing-price-listing_3')).toBeTruthy();
    expect(screen.getByText('$89.00')).toBeTruthy();
    expect(screen.getByText(/Sec 118 · Row 8 · 10s price demo/)).toBeTruthy();
  });

  it('invokes onSelect for an available listing', () => {
    const onSelect = jest.fn();

    render(<ListingCard listing={longDemoListing} selected={false} onSelect={onSelect} />);

    fireEvent.press(screen.getByTestId('listing-card-listing_3'));
    expect(onSelect).toHaveBeenCalledWith('listing_3');
  });
});
