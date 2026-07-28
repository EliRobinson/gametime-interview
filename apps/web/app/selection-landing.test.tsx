import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { SelectionLanding } from './selection-landing';

const push = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

jest.mock('../src/trpc-client', () => ({
  trpc: {
    listings: {
      list: { query: jest.fn() },
    },
    checkout: {
      create: { mutate: jest.fn() },
    },
  },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { trpc } = require('../src/trpc-client') as {
  trpc: {
    listings: { list: { query: jest.Mock } };
    checkout: { create: { mutate: jest.Mock } };
  };
};

beforeEach(() => {
  push.mockReset();
  trpc.listings.list.query.mockReset();
  trpc.checkout.create.mutate.mockReset();
  trpc.listings.list.query.mockResolvedValue({
    listings: [
      { listingId: 'listing_1', priceCents: 15400, available: true },
      { listingId: 'listing_2', priceCents: 12500, available: true },
    ],
  });
});

describe('SelectionLanding', () => {
  it('renders listings and creates a checkout session on Continue', async () => {
    trpc.checkout.create.mutate.mockResolvedValue({ id: 'sess_new', listingId: 'listing_1' });

    render(<SelectionLanding />);

    await waitFor(() => expect(screen.getByTestId('listing-card-listing_1')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('listing-card-listing_1'));
    fireEvent.click(screen.getByTestId('listing-continue'));

    await waitFor(() =>
      expect(trpc.checkout.create.mutate).toHaveBeenCalledWith({ listingId: 'listing_1' }),
    );
    expect(push).toHaveBeenCalledWith('/checkout/sess_new');
  });

  it('shows retry when listings fail to load', async () => {
    trpc.listings.list.query.mockRejectedValue(new Error('offline'));

    render(<SelectionLanding />);

    await waitFor(() => expect(screen.getByTestId('listings-load-error')).toBeInTheDocument());
    expect(screen.getByTestId('listings-retry')).toBeInTheDocument();
  });
});
