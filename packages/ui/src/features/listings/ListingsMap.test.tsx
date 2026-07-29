import { colors } from '@repo/tokens';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text as RNText } from 'react-native';

import type { ListingRowView } from './listings.view-model';
import { ListingsMap } from './ListingsMap';

const listings: ListingRowView[] = [
  {
    listingId: 'listing_1',
    section: '309',
    row: 'JJ',
    seatCount: 2,
    isSuperDeal: true,
    bubble: { leftPct: 50, topPct: 40 },
    urgencyTicketsLeft: 4,
    priceCents: 15400,
    available: true,
    formattedPrice: '$154.00',
  },
  {
    listingId: 'listing_2',
    section: '204',
    row: '12',
    seatCount: 2,
    isSuperDeal: false,
    bubble: { leftPct: 30, topPct: 50 },
    priceCents: 12500,
    available: true,
    formattedPrice: '$125.00',
  },
];

describe('ListingsMap', () => {
  it('renders the Gametime stadium photo behind price bubbles', () => {
    render(<ListingsMap listings={listings} selectedListingId={null} onSelect={jest.fn()} />);

    const map = screen.getByTestId('listings-map');
    const image = screen.getByTestId('listings-stadium-image');
    expect(map).toBeTruthy();
    expect(image.props.source.uri).toContain(
      'maps.gametime.co/v2/centurylink_field/edsheeran/edsheeran-8.png',
    );
    expect(image.props.source.uri).toContain('width=1280');
    expect(screen.getByTestId('map-bubble-listing_1')).toBeTruthy();
  });

  it('selects a listing when a price bubble is pressed', () => {
    const onSelect = jest.fn();
    render(<ListingsMap listings={listings} selectedListingId={null} onSelect={onSelect} />);

    fireEvent.press(screen.getByTestId('map-bubble-listing_1'));
    expect(onSelect).toHaveBeenCalledWith('listing_1');
  });

  it.each([
    {
      name: 'super deal uses dark ink on accent green',
      listingId: 'listing_1',
      expectedLabelColor: colors.canvas,
    },
    {
      name: 'standard deal uses light ink on dark bubble',
      listingId: 'listing_2',
      expectedLabelColor: colors.onDark,
    },
  ])('$name', ({ listingId, expectedLabelColor }) => {
    render(<ListingsMap listings={listings} selectedListingId={null} onSelect={jest.fn()} />);

    const bubble = screen.getByTestId(`map-bubble-${listingId}`);
    const labels = bubble.findAllByType(RNText);
    expect(labels.length).toBeGreaterThan(0);
    labels.forEach((label) => {
      expect(label.props.style.color).toBe(expectedLabelColor);
    });
  });
});
