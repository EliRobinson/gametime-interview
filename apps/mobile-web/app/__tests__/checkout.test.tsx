import type { CheckoutSession } from '@repo/api-contracts';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { trpc } from '@/lib/trpc-client';

import CheckoutScreen from '../checkout/[id]';

jest.mock('../../src/lib/trpc-client', () => ({
  trpc: {
    checkout: {
      resume: { mutate: jest.fn() },
      complete: { mutate: jest.fn() },
      confirmPrice: { mutate: jest.fn() },
    },
  },
}));

// Prefixed with `mock` so jest's module factory is allowed to close over it.
let mockParams: Record<string, string | string[] | undefined> = { id: 'sess_1' };

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockParams,
  useRouter: () => ({ back: jest.fn() }),
}));

const activeSession: CheckoutSession = {
  id: 'sess_1',
  listingId: 'listing_1',
  status: 'active',
  priceAtCreation: 4200,
  acknowledgedPrice: 4200,
  createdAt: '2026-01-01T00:00:00.000Z',
  expiresAt: '2026-01-01T00:10:00.000Z',
  failureReason: null,
};

const resume = trpc.checkout.resume.mutate as jest.Mock;
const complete = trpc.checkout.complete.mutate as jest.Mock;
const confirmPrice = trpc.checkout.confirmPrice.mutate as jest.Mock;

// A TRPCClientError carries its wire code on `error.data.code`; the screen
// duck-types that shape rather than importing the class, so the fakes below
// are exactly what it reads in production.
function trpcError(code: string, message = code) {
  return Object.assign(new Error(message), { data: { code } });
}

beforeEach(() => {
  mockParams = { id: 'sess_1' };
  resume.mockReset();
  complete.mockReset();
  confirmPrice.mockReset();
});

describe('CheckoutScreen', () => {
  it('shows a loading state, then the active checkout state once resumed', async () => {
    // Keep resume pending until after the first paint so we can assert loading —
    // mockResolvedValue settles inside RTL's act() and skips straight to ready.
    let resolveResume!: (session: CheckoutSession) => void;
    resume.mockImplementation(
      () =>
        new Promise<CheckoutSession>((resolve) => {
          resolveResume = resolve;
        }),
    );

    render(<CheckoutScreen />);

    expect(screen.getByText(/finding your checkout/i)).toBeTruthy();

    resolveResume(activeSession);

    await waitFor(() => expect(screen.getByTestId('complete-button')).toBeTruthy());
    expect(screen.getByText(/\$42\.00/)).toBeTruthy();
  });

  it('resumes reporting the mobile surface so the event log records the handoff', async () => {
    resume.mockResolvedValue(activeSession);

    render(<CheckoutScreen />);

    await waitFor(() => expect(resume).toHaveBeenCalledTimes(1));
    expect(resume).toHaveBeenCalledWith({ sessionId: 'sess_1', surface: 'mobile' });
  });

  it('shows an unavailable state for an expired session', async () => {
    resume.mockResolvedValue({ ...activeSession, status: 'expired' });

    render(<CheckoutScreen />);

    await waitFor(() => expect(screen.getByText(/no longer available/i)).toBeTruthy());
  });

  it('distinguishes an expired session from an unavailable listing', async () => {
    resume.mockResolvedValue({ ...activeSession, status: 'expired' });
    const expiredView = render(<CheckoutScreen />);
    await waitFor(() => expect(screen.getByText('Checkout session expired')).toBeTruthy());
    expect(screen.queryByText('Listing no longer available')).toBeNull();
    expiredView.unmount();

    resume.mockResolvedValue(activeSession);
    complete.mockRejectedValue(trpcError('UNPROCESSABLE_CONTENT'));
    render(<CheckoutScreen />);
    await waitFor(() => expect(screen.getByTestId('complete-button')).toBeTruthy());
    fireEvent.press(screen.getByTestId('complete-button'));

    await waitFor(() => expect(screen.getByText('Listing no longer available')).toBeTruthy());
    expect(screen.queryByText('Checkout session expired')).toBeNull();
  });

  it('reads unavailability off a resumed session whose inventory hold was released', async () => {
    // The session's own clock is fine; the hold underneath it went away. Resume
    // reports that as `expired`, and only `expiryReason` says which clock ran out.
    resume.mockResolvedValue({
      ...activeSession,
      status: 'expired',
      expiryReason: 'hold_released',
    });

    render(<CheckoutScreen />);

    await waitFor(() => expect(screen.getByText('Listing no longer available')).toBeTruthy());
    expect(screen.queryByText('Checkout session expired')).toBeNull();
  });

  it('shows a confirmation state for a completed session', async () => {
    resume.mockResolvedValue({ ...activeSession, status: 'completed' });

    render(<CheckoutScreen />);

    await waitFor(() => expect(screen.getByText(/order complete/i)).toBeTruthy());
  });

  it('requires an explicit acknowledgement before completing at a changed price', async () => {
    resume.mockResolvedValue(activeSession);
    complete.mockRejectedValueOnce(trpcError('PRECONDITION_FAILED'));
    confirmPrice.mockResolvedValue({ ...activeSession, acknowledgedPrice: 5500 });

    render(<CheckoutScreen />);
    await waitFor(() => expect(screen.getByTestId('complete-button')).toBeTruthy());

    fireEvent.press(screen.getByTestId('complete-button'));

    await waitFor(() => expect(screen.getByTestId('price-changed-banner')).toBeTruthy());
    expect(screen.getByTestId('confirm-price-button')).toBeTruthy();
    // The fan has not been repriced: nothing was charged and no confirmation
    // was sent on their behalf.
    expect(confirmPrice).not.toHaveBeenCalled();

    fireEvent.press(screen.getByTestId('confirm-price-button'));

    await waitFor(() =>
      expect(confirmPrice).toHaveBeenCalledWith({ sessionId: 'sess_1', surface: 'mobile' }),
    );
    // Acknowledging the new price surfaces it and hands the fan back the
    // Complete purchase decision — it must not auto-charge.
    await waitFor(() => expect(screen.getByTestId('acknowledged-price')).toBeTruthy());
    expect(String(screen.getByTestId('acknowledged-price').props.children)).toMatch(/\$55\.00/);
    expect(screen.getByTestId('complete-button')).toBeTruthy();
    expect(complete).toHaveBeenCalledTimes(1);
  });

  it('tells the fan the order is being completed on another device on CONFLICT', async () => {
    resume.mockResolvedValue(activeSession);
    complete.mockRejectedValue(trpcError('CONFLICT'));

    render(<CheckoutScreen />);
    await waitFor(() => expect(screen.getByTestId('complete-button')).toBeTruthy());
    fireEvent.press(screen.getByTestId('complete-button'));

    await waitFor(() => expect(screen.getByText('Finishing on another device')).toBeTruthy());
    expect(screen.getByText(/already being completed on another device/i)).toBeTruthy();
    // This is a race, not a breakage — it must not read like an error.
    expect(screen.queryByText(/went wrong/i)).toBeNull();
  });

  it('shows the failure reason and lets the fan retry a failed payment', async () => {
    resume.mockResolvedValue({
      ...activeSession,
      status: 'failed',
      failureReason: 'card_declined',
    });
    complete.mockResolvedValue({ ...activeSession, status: 'completed' });

    render(<CheckoutScreen />);

    await waitFor(() => expect(screen.getByText(/payment didn't go through/i)).toBeTruthy());
    expect(screen.getByText(/card_declined/i)).toBeTruthy();

    fireEvent.press(screen.getByTestId('retry-button'));

    await waitFor(() => expect(screen.getByText(/order complete/i)).toBeTruthy());
    expect(complete).toHaveBeenCalledWith({ sessionId: 'sess_1', surface: 'mobile' });
  });

  it('shows a not-found state for an unknown session id', async () => {
    resume.mockRejectedValue(trpcError('NOT_FOUND'));

    render(<CheckoutScreen />);

    await waitFor(() => expect(screen.getByText(/couldn't find this checkout/i)).toBeTruthy());
  });

  it('handles a missing session id in the deep link without calling the API', async () => {
    mockParams = {};

    render(<CheckoutScreen />);

    await waitFor(() => expect(screen.getByText(/missing a checkout id/i)).toBeTruthy());
    expect(resume).not.toHaveBeenCalled();
  });

  it('shows Share tickets with web and mobile resume URLs', async () => {
    resume.mockResolvedValue(activeSession);

    render(<CheckoutScreen />);

    await waitFor(() => expect(screen.getByTestId('share-tickets-button')).toBeTruthy());
    expect(screen.getByTestId('share-web-url').props.children).toContain(
      'http://localhost:3001/checkout/sess_1',
    );
    expect(screen.getByTestId('share-mobile-url').props.children).toContain(
      'mobileweb://checkout/sess_1',
    );
  });
});
