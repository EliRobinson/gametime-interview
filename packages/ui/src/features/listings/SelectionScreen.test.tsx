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

const defaultProps = {
  view,
  loading: false,
  loadError: false,
  busy: false,
  createError: null as string | null,
  onRetry: jest.fn(),
  onContinue: jest.fn(),
};

describe('SelectionScreen', () => {
  describe('sidebar layout (sticky dock)', () => {
    it('disables Continue until an available listing is selected', () => {
      const onContinue = jest.fn();

      render(<SelectionScreen {...defaultProps} onContinue={onContinue} layout="sidebar" />);

      expect(screen.getByTestId('selection-event-header')).toBeTruthy();
      expect(screen.getByTestId('listing-detail-empty')).toBeTruthy();
      expect(screen.getByTestId('listing-continue').props.accessibilityState?.disabled).toBe(true);

      fireEvent.press(screen.getByTestId('listing-card-listing_1'));
      expect(screen.getByTestId('listing-detail')).toBeTruthy();
      expect(screen.getByTestId('listing-continue').props.accessibilityState?.disabled).toBe(false);

      fireEvent.press(screen.getByTestId('listing-continue'));
      expect(onContinue).toHaveBeenCalledWith(expect.objectContaining({ listingId: 'listing_1' }));
    });

    it('keeps the event header mounted when selecting a listing', () => {
      render(<SelectionScreen {...defaultProps} layout="sidebar" />);

      expect(screen.getByTestId('selection-event-header')).toBeTruthy();
      fireEvent.press(screen.getByTestId('listing-card-listing_1'));
      expect(screen.getByTestId('selection-event-header')).toBeTruthy();
      expect(screen.getByTestId('listing-detail')).toBeTruthy();
      expect(screen.queryByTestId('listing-detail-empty')).toBeNull();
    });

    it('does not select an unavailable listing from a card', () => {
      render(<SelectionScreen {...defaultProps} layout="sidebar" />);

      fireEvent.press(screen.getByTestId('listing-card-listing_2'));
      expect(screen.getByTestId('listing-detail-empty')).toBeTruthy();
    });
  });

  describe('stacked layout (inline expand)', () => {
    it('expands Continue on the selected card without a sticky dock', () => {
      const onContinue = jest.fn();

      render(<SelectionScreen {...defaultProps} onContinue={onContinue} layout="stacked" />);

      expect(screen.queryByTestId('listing-detail-empty')).toBeNull();
      expect(screen.queryByTestId('listing-detail')).toBeNull();
      expect(screen.queryByTestId('listing-continue')).toBeNull();

      fireEvent.press(screen.getByTestId('listing-card-listing_1'));
      expect(screen.getByTestId('listing-card-expanded-listing_1')).toBeTruthy();
      expect(screen.getByTestId('listing-continue').props.accessibilityState?.disabled).toBe(false);

      fireEvent.press(screen.getByTestId('listing-continue'));
      expect(onContinue).toHaveBeenCalledWith(expect.objectContaining({ listingId: 'listing_1' }));
    });

    it('keeps the map and event header mounted when selecting', () => {
      render(<SelectionScreen {...defaultProps} layout="stacked" />);

      expect(screen.getByTestId('selection-event-header')).toBeTruthy();
      expect(screen.getByTestId('listings-map')).toBeTruthy();
      fireEvent.press(screen.getByTestId('listing-card-listing_1'));
      expect(screen.getByTestId('selection-event-header')).toBeTruthy();
      expect(screen.getByTestId('listings-map')).toBeTruthy();
    });

    it('does not expand an unavailable listing', () => {
      render(<SelectionScreen {...defaultProps} layout="stacked" />);

      fireEvent.press(screen.getByTestId('listing-card-listing_2'));
      expect(screen.queryByTestId('listing-card-expanded-listing_2')).toBeNull();
      expect(screen.queryByTestId('listing-continue')).toBeNull();
    });
  });

  it('shows load error and retry', () => {
    const onRetry = jest.fn();

    render(
      <SelectionScreen
        {...defaultProps}
        view={null}
        loadError
        onRetry={onRetry}
        onContinue={jest.fn()}
      />,
    );

    expect(screen.getByText(LISTINGS_COPY.loadError)).toBeTruthy();
    fireEvent.press(screen.getByTestId('listings-retry'));
    expect(onRetry).toHaveBeenCalled();
  });
});
