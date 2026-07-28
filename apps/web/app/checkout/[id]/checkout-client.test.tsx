import type { CheckoutSession } from '@repo/api-contracts';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { CheckoutClient } from './checkout-client';

jest.mock('../../../src/trpc-client', () => ({
  trpc: {
    checkout: {
      complete: { mutate: jest.fn() },
      confirmPrice: { mutate: jest.fn() },
    },
  },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { trpc } = require('../../../src/trpc-client') as {
  trpc: {
    checkout: {
      complete: { mutate: jest.Mock };
      confirmPrice: { mutate: jest.Mock };
    };
  };
};

const baseSession: CheckoutSession = {
  id: 'sess_1',
  listingId: 'listing_1',
  status: 'active',
  priceAtCreation: 4200,
  acknowledgedPrice: 4200,
  createdAt: '2026-01-01T00:00:00.000Z',
  expiresAt: '2026-01-01T00:10:00.000Z',
  failureReason: null,
};

/** Shaped like a TRPCClientError: the wire code hangs off `.data.code`. */
function trpcError(code: string, message = 'nope'): Error & { data: { code: string } } {
  return Object.assign(new Error(message), { data: { code } });
}

beforeEach(() => {
  trpc.checkout.complete.mutate.mockReset();
  trpc.checkout.confirmPrice.mutate.mockReset();
});

describe('CheckoutClient', () => {
  it('renders the acknowledged price for an active session', () => {
    render(<CheckoutClient initialSession={baseSession} />);
    expect(screen.getByText(/\$42\.00/)).toBeInTheDocument();
  });

  it('shows a price-change banner when the live price differs from the acknowledged price', () => {
    render(
      <CheckoutClient
        initialSession={{ ...baseSession, acknowledgedPrice: 4200 }}
        priceChangedTo={5000}
      />,
    );
    expect(screen.getByText(/price changed/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /confirm at new price/i })).toBeInTheDocument();
  });

  it('shows an unavailable message for an expired session', () => {
    render(<CheckoutClient initialSession={{ ...baseSession, status: 'expired' }} />);
    expect(screen.getByText(/no longer available/i)).toBeInTheDocument();
  });

  it('disables completion until an unacknowledged price change is confirmed', () => {
    render(<CheckoutClient initialSession={baseSession} priceChangedTo={5000} />);
    expect(screen.getByRole('button', { name: /complete purchase/i })).toBeDisabled();
  });

  it('shows a confirmation for a completed session and offers no complete button', () => {
    render(<CheckoutClient initialSession={{ ...baseSession, status: 'completed' }} />);
    expect(screen.getByText(/you're all set/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /complete purchase/i })).not.toBeInTheDocument();
  });

  it('shows the failure reason and a retry button for a failed session', () => {
    render(
      <CheckoutClient
        initialSession={{ ...baseSession, status: 'failed', failureReason: 'card_declined' }}
      />,
    );
    expect(screen.getByText(/card_declined/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('moves into the price-change state when complete rejects with PRECONDITION_FAILED', async () => {
    trpc.checkout.complete.mutate.mockRejectedValue(trpcError('PRECONDITION_FAILED'));
    render(<CheckoutClient initialSession={baseSession} />);

    fireEvent.click(screen.getByRole('button', { name: /complete purchase/i }));

    await waitFor(() => expect(screen.getByText(/price changed/i)).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /complete purchase/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /confirm at new price/i })).toBeInTheDocument();
  });

  it('re-enables completion at the new price only after the fan acknowledges it', async () => {
    trpc.checkout.confirmPrice.mutate.mockResolvedValue({
      ...baseSession,
      acknowledgedPrice: 5000,
    });
    render(<CheckoutClient initialSession={baseSession} priceChangedTo={5000} />);

    fireEvent.click(screen.getByRole('button', { name: /confirm at new price/i }));

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /complete purchase/i })).toBeEnabled(),
    );
    expect(screen.getByText(/\$50\.00/)).toBeInTheDocument();
    expect(trpc.checkout.confirmPrice.mutate).toHaveBeenCalledWith({
      sessionId: 'sess_1',
      surface: 'web',
    });
  });

  it('explains a CONFLICT as another device already completing the order', async () => {
    trpc.checkout.complete.mutate.mockRejectedValue(trpcError('CONFLICT'));
    render(<CheckoutClient initialSession={baseSession} />);

    fireEvent.click(screen.getByRole('button', { name: /complete purchase/i }));

    await waitFor(() => expect(screen.getByText(/another device/i)).toBeInTheDocument());
  });

  it('falls back to the unavailable state when complete rejects with TIMEOUT', async () => {
    trpc.checkout.complete.mutate.mockRejectedValue(trpcError('TIMEOUT'));
    render(<CheckoutClient initialSession={baseSession} />);

    fireEvent.click(screen.getByRole('button', { name: /complete purchase/i }));

    await waitFor(() => expect(screen.getByText(/no longer available/i)).toBeInTheDocument());
  });
});
