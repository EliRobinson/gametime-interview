import type { CheckoutSession } from '@repo/api-contracts';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { CheckoutClient } from './checkout-client';

jest.mock('../../../src/trpc-client', () => ({
  trpc: {
    checkout: {
      complete: { mutate: jest.fn() },
      confirmPrice: { mutate: jest.fn() },
      release: { mutate: jest.fn() },
    },
  },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { trpc } = require('../../../src/trpc-client') as {
  trpc: {
    checkout: {
      complete: { mutate: jest.Mock };
      confirmPrice: { mutate: jest.Mock };
      release: { mutate: jest.Mock };
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
  trpc.checkout.release.mutate.mockReset();
  trpc.checkout.release.mutate.mockResolvedValue({
    ...baseSession,
    status: 'expired',
    expiryReason: 'hold_released',
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('CheckoutClient', () => {
  it('renders the continue CTA for an active session', () => {
    render(<CheckoutClient initialSession={baseSession} />);
    expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
  });

  it('shows a price-change banner when the live price differs from the acknowledged price', () => {
    render(
      <CheckoutClient
        initialSession={{ ...baseSession, acknowledgedPrice: 4200 }}
        priceChangedTo={5000}
      />,
    );
    expect(screen.getByText(/price changed/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /confirm new price/i })).toBeInTheDocument();
  });

  it('tells a lapsed session apart from a released hold', () => {
    // Same status, different cause — and different next steps for the fan.
    const lapsed = render(
      <CheckoutClient
        initialSession={{ ...baseSession, status: 'expired', expiryReason: 'session_lapsed' }}
      />,
    );
    expect(screen.getByText(/checkout session expired/i)).toBeInTheDocument();
    expect(screen.queryByText(/listing no longer available/i)).not.toBeInTheDocument();
    lapsed.unmount();

    render(
      <CheckoutClient
        initialSession={{ ...baseSession, status: 'expired', expiryReason: 'hold_released' }}
      />,
    );
    expect(screen.getByText(/listing no longer available/i)).toBeInTheDocument();
    expect(screen.queryByText(/checkout session expired/i)).not.toBeInTheDocument();
  });

  it('hides completion until an unacknowledged price change is confirmed', () => {
    render(<CheckoutClient initialSession={baseSession} priceChangedTo={5000} />);
    expect(screen.queryByRole('button', { name: /continue/i })).not.toBeInTheDocument();
  });

  it('shows a confirmation for a completed session and offers no complete button', () => {
    render(<CheckoutClient initialSession={{ ...baseSession, status: 'completed' }} />);
    expect(screen.getByText(/you're all set/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /continue/i })).not.toBeInTheDocument();
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

    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => expect(screen.getByText(/price changed/i)).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: /continue/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /confirm new price/i })).toBeInTheDocument();
  });

  it('re-enables completion at the new price only after the fan acknowledges it', async () => {
    trpc.checkout.confirmPrice.mutate.mockResolvedValue({
      ...baseSession,
      acknowledgedPrice: 5000,
    });
    render(<CheckoutClient initialSession={baseSession} priceChangedTo={5000} />);

    fireEvent.click(screen.getByRole('button', { name: /confirm new price/i }));

    await waitFor(() => expect(screen.getByRole('button', { name: /continue/i })).toBeEnabled());
    expect(screen.getByTestId('price-notice')).toHaveTextContent(/\$50\.00/);
    expect(trpc.checkout.confirmPrice.mutate).toHaveBeenCalledWith({
      sessionId: 'sess_1',
      surface: 'web',
    });
  });

  it('explains a CONFLICT as another device already completing the order', async () => {
    trpc.checkout.complete.mutate.mockRejectedValue(trpcError('CONFLICT'));
    render(<CheckoutClient initialSession={baseSession} />);

    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => expect(screen.getAllByText(/another device/i).length).toBeGreaterThan(0));
  });

  it('reports a lapsed session when complete rejects with TIMEOUT', async () => {
    trpc.checkout.complete.mutate.mockRejectedValue(trpcError('TIMEOUT'));
    render(<CheckoutClient initialSession={baseSession} />);

    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => expect(screen.getByText(/checkout session expired/i)).toBeInTheDocument());
  });

  it('reports a released hold when complete rejects with UNPROCESSABLE_CONTENT', async () => {
    trpc.checkout.complete.mutate.mockRejectedValue(trpcError('UNPROCESSABLE_CONTENT'));
    render(<CheckoutClient initialSession={baseSession} />);

    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() =>
      expect(screen.getByText(/listing no longer available/i)).toBeInTheDocument(),
    );
  });

  it('exposes Share tickets for an active session without rendering raw URLs', () => {
    render(<CheckoutClient initialSession={baseSession} />);

    expect(screen.getByRole('button', { name: /share tickets/i })).toBeInTheDocument();
    expect(screen.queryByText(/http:\/\/localhost:3001\/checkout\//)).not.toBeInTheDocument();
    expect(screen.queryByText(/mobileweb:\/\/checkout\//)).not.toBeInTheDocument();
  });

  it('hides share for a completed session', () => {
    render(<CheckoutClient initialSession={{ ...baseSession, status: 'completed' }} />);

    expect(screen.queryByRole('button', { name: /share tickets/i })).not.toBeInTheDocument();
  });

  describe('leaving checkout with an active hold', () => {
    const leaveMessage = /leaving this page will remove the lock on the ticket/i;

    function renderWithHomeLink(session: CheckoutSession = baseSession) {
      return render(
        <>
          <a href="/">Gametime home</a>
          <CheckoutClient initialSession={session} />
        </>,
      );
    }

    it('prompts, releases the hold, then navigates when the fan confirms the logo link', async () => {
      const confirm = jest.spyOn(window, 'confirm').mockReturnValue(true);
      const assign = jest.fn();
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: {
          ...window.location,
          assign,
          href: 'http://localhost/checkout/sess_1',
          pathname: '/checkout/sess_1',
          origin: 'http://localhost',
        },
      });

      renderWithHomeLink();
      fireEvent.click(screen.getByRole('link', { name: /gametime home/i }));

      expect(confirm).toHaveBeenCalledWith(expect.stringMatching(leaveMessage));
      await waitFor(() =>
        expect(trpc.checkout.release.mutate).toHaveBeenCalledWith({
          sessionId: 'sess_1',
          surface: 'web',
        }),
      );
      await waitFor(() => expect(assign).toHaveBeenCalledWith('http://localhost/'));
    });

    it('keeps the hold and stays put when the fan cancels the leave prompt', async () => {
      jest.spyOn(window, 'confirm').mockReturnValue(false);
      const assign = jest.fn();
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: {
          ...window.location,
          assign,
          href: 'http://localhost/checkout/sess_1',
          pathname: '/checkout/sess_1',
          origin: 'http://localhost',
        },
      });

      renderWithHomeLink();
      fireEvent.click(screen.getByRole('link', { name: /gametime home/i }));

      expect(trpc.checkout.release.mutate).not.toHaveBeenCalled();
      expect(assign).not.toHaveBeenCalled();
    });

    it('still navigates after confirm when release fails', async () => {
      jest.spyOn(window, 'confirm').mockReturnValue(true);
      trpc.checkout.release.mutate.mockRejectedValue(new Error('offline'));
      const assign = jest.fn();
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: {
          ...window.location,
          assign,
          href: 'http://localhost/checkout/sess_1',
          pathname: '/checkout/sess_1',
          origin: 'http://localhost',
        },
      });

      renderWithHomeLink();
      fireEvent.click(screen.getByRole('link', { name: /gametime home/i }));

      await waitFor(() => expect(assign).toHaveBeenCalledWith('http://localhost/'));
    });

    it('prompts and releases when the fan confirms browser back', async () => {
      jest.spyOn(window, 'confirm').mockReturnValue(true);
      const historyBack = jest.spyOn(window.history, 'back').mockImplementation(() => undefined);

      renderWithHomeLink();
      fireEvent.popState(window);

      expect(window.confirm).toHaveBeenCalledWith(expect.stringMatching(leaveMessage));
      await waitFor(() =>
        expect(trpc.checkout.release.mutate).toHaveBeenCalledWith({
          sessionId: 'sess_1',
          surface: 'web',
        }),
      );
      await waitFor(() => expect(historyBack).toHaveBeenCalled());
    });

    it('does not prompt or release for a completed session', () => {
      jest.spyOn(window, 'confirm').mockReturnValue(true);
      const assign = jest.fn();
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: {
          ...window.location,
          assign,
          href: 'http://localhost/checkout/sess_1',
          pathname: '/checkout/sess_1',
          origin: 'http://localhost',
        },
      });

      renderWithHomeLink({ ...baseSession, status: 'completed' });
      fireEvent.click(screen.getByRole('link', { name: /gametime home/i }));

      expect(window.confirm).not.toHaveBeenCalled();
      expect(trpc.checkout.release.mutate).not.toHaveBeenCalled();
    });
  });
});
