import { fireEvent, render, screen } from '@testing-library/react-native';

import { LISTINGS_COPY } from './listings.copy';
import type { SelectionViewModel } from './listings.view-model';
import { SelectionScreen } from './SelectionScreen';

const view: SelectionViewModel = {
  event: {
    artist: 'Ed Sheeran',
    venue: 'Lumen Field',
    datetimeLabel: 'Sat 8/1 at 5:30 PM',
    city: 'Seattle',
  },
  listings: [
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
      available: false,
      formattedPrice: '$125.00',
    },
  ],
};

describe('SelectionScreen', () => {
  it('disables Continue until an available listing is selected', () => {
    const onContinue = jest.fn();

    render(
      <SelectionScreen
        view={view}
        loading={false}
        loadError={false}
        busy={false}
        createError={null}
        onRetry={jest.fn()}
        onContinue={onContinue}
      />,
    );

    expect(screen.getByTestId('listing-continue').props.accessibilityState?.disabled).toBe(true);

    fireEvent.press(screen.getByTestId('listing-card-listing_1'));
    expect(screen.getByTestId('listing-continue').props.accessibilityState?.disabled).toBe(false);

    fireEvent.press(screen.getByTestId('listing-continue'));
    expect(onContinue).toHaveBeenCalledWith(expect.objectContaining({ listingId: 'listing_1' }));
  });

  it('does not select an unavailable listing from a card', () => {
    render(
      <SelectionScreen
        view={view}
        loading={false}
        loadError={false}
        busy={false}
        createError={null}
        onRetry={jest.fn()}
        onContinue={jest.fn()}
      />,
    );

    fireEvent.press(screen.getByTestId('listing-card-listing_2'));
    expect(screen.getByTestId('listing-detail-empty')).toBeTruthy();
  });

  it('shows load error and retry', () => {
    const onRetry = jest.fn();

    render(
      <SelectionScreen
        view={null}
        loading={false}
        loadError
        busy={false}
        createError={null}
        onRetry={onRetry}
        onContinue={jest.fn()}
      />,
    );

    expect(screen.getByText(LISTINGS_COPY.loadError)).toBeTruthy();
    fireEvent.press(screen.getByTestId('listings-retry'));
    expect(onRetry).toHaveBeenCalled();
  });
});
