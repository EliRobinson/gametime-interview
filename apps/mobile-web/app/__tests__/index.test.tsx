import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import HomeScreen from '../index';

const mockPush = jest.fn();
const mockRefetch = jest.fn();
const mockUseQuery = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/lib/trpc', () => ({
  trpc: {
    listings: {
      list: {
        useQuery: (...args: unknown[]) => mockUseQuery(...args),
      },
    },
  },
}));

jest.mock('../../src/lib/trpc-client', () => ({
  trpc: {
    checkout: {
      create: { mutate: jest.fn() },
    },
  },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { trpc: vanillaTrpc } = require('../../src/lib/trpc-client') as {
  trpc: { checkout: { create: { mutate: jest.Mock } } };
};

beforeEach(() => {
  mockPush.mockReset();
  mockRefetch.mockReset();
  mockUseQuery.mockReset();
  mockUseQuery.mockReturnValue({
    data: {
      listings: [{ listingId: 'listing_1', priceCents: 15400, available: true }],
    },
    isLoading: false,
    isError: false,
    isSuccess: true,
    refetch: mockRefetch,
  });
  vanillaTrpc.checkout.create.mutate.mockReset();
});

describe('HomeScreen', () => {
  it('polls listings every 10 seconds for status changes', () => {
    render(<HomeScreen />);

    expect(mockUseQuery).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({ refetchInterval: 10_000 }),
    );
  });

  it('renders listings and navigates after Continue creates a session', async () => {
    vanillaTrpc.checkout.create.mutate.mockResolvedValue({
      id: 'sess_mobile',
      listingId: 'listing_1',
    });

    render(<HomeScreen />);

    expect(screen.getByTestId('listing-card-listing_1')).toBeTruthy();

    fireEvent.press(screen.getByTestId('listing-card-listing_1'));
    fireEvent.press(screen.getByTestId('listing-continue'));

    await waitFor(() =>
      expect(vanillaTrpc.checkout.create.mutate).toHaveBeenCalledWith({ listingId: 'listing_1' }),
    );
    expect(mockPush).toHaveBeenCalledWith('/checkout/sess_mobile');
  });
});
