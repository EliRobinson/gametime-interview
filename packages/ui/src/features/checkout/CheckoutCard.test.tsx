import type { CheckoutSession } from '@repo/api-contracts';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { CHECKOUT_COPY } from './checkout.copy';
import { CheckoutCard } from './CheckoutCard';

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

const noop = () => {};

describe('CheckoutCard', () => {
  it('shows complete purchase CTA for ready view without resume hero', () => {
    render(
      <CheckoutCard
        view={{ kind: 'ready', session: activeSession, notice: null }}
        busy={false}
        onComplete={noop}
        onConfirmPrice={noop}
      />,
    );

    expect(screen.getByTestId('complete-button')).toBeTruthy();
    expect(screen.getByText(CHECKOUT_COPY.completePurchase)).toBeTruthy();
    expect(screen.queryByText(/resumed checkout/i)).toBeNull();
    expect(screen.queryByText(/finish your checkout/i)).toBeNull();
  });

  it('shows confirm price CTA for price_changed', () => {
    render(
      <CheckoutCard
        view={{ kind: 'price_changed', session: activeSession }}
        busy={false}
        onComplete={noop}
        onConfirmPrice={noop}
      />,
    );

    expect(screen.getByTestId('price-changed-banner').props.accessibilityRole).toBe('alert');
    expect(screen.getByTestId('confirm-price-button')).toBeTruthy();
    expect(screen.getByText(CHECKOUT_COPY.confirmNewPrice)).toBeTruthy();
  });

  it('mentions new price in price_changed banner when newPriceCents is set', () => {
    render(
      <CheckoutCard
        view={{ kind: 'price_changed', session: activeSession, newPriceCents: 4500 }}
        busy={false}
        onComplete={noop}
        onConfirmPrice={noop}
      />,
    );

    expect(screen.getByText(/The new price is \$45\.00\./)).toBeTruthy();
  });

  it.each([
    { kind: 'expired' as const, title: CHECKOUT_COPY.expired.title },
    { kind: 'unavailable' as const, title: CHECKOUT_COPY.unavailable.title },
  ])('shows distinct title for $kind', ({ kind, title }) => {
    render(<CheckoutCard view={{ kind }} busy={false} onComplete={noop} onConfirmPrice={noop} />);

    expect(screen.getByText(title)).toBeTruthy();
  });

  it('shows retry button for failed view', () => {
    const failedSession: CheckoutSession = {
      ...activeSession,
      status: 'failed',
      failureReason: 'card_declined',
    };

    render(
      <CheckoutCard
        view={{ kind: 'failed', session: failedSession }}
        busy={false}
        onComplete={noop}
        onConfirmPrice={noop}
      />,
    );

    expect(screen.getByTestId('retry-button')).toBeTruthy();
    expect(screen.getByText(CHECKOUT_COPY.retry)).toBeTruthy();
  });

  it('shows spinner label and subtitle for loading', () => {
    render(
      <CheckoutCard
        view={{ kind: 'loading' }}
        busy={false}
        onComplete={noop}
        onConfirmPrice={noop}
      />,
    );

    expect(screen.getByText(CHECKOUT_COPY.loading)).toBeTruthy();
    expect(screen.getByText(CHECKOUT_COPY.loadingSubtitle)).toBeTruthy();
  });

  it('shows price notice when provided', () => {
    render(
      <CheckoutCard
        view={{
          kind: 'ready',
          session: activeSession,
          notice: 'Price updated to $42.00.',
        }}
        busy={false}
        onComplete={noop}
        onConfirmPrice={noop}
      />,
    );

    expect(screen.getByTestId('price-notice')).toBeTruthy();
    expect(screen.getByText('Price updated to $42.00.')).toBeTruthy();
  });

  it('calls onComplete when complete button is pressed', () => {
    const onComplete = jest.fn();

    render(
      <CheckoutCard
        view={{ kind: 'ready', session: activeSession, notice: null }}
        busy={false}
        onComplete={onComplete}
        onConfirmPrice={noop}
      />,
    );

    fireEvent.press(screen.getByTestId('complete-button'));
    expect(onComplete).toHaveBeenCalledWith(activeSession);
  });

  it('shows Share tickets when share URLs are provided', () => {
    const onShare = jest.fn();

    render(
      <CheckoutCard
        view={{ kind: 'ready', session: activeSession, notice: null }}
        busy={false}
        onComplete={noop}
        onConfirmPrice={noop}
        shareWebUrl="http://localhost:3001/checkout/sess_1"
        shareMobileUrl="mobileweb://checkout/sess_1"
        onShare={onShare}
      />,
    );

    expect(screen.getByText(CHECKOUT_COPY.shareTickets)).toBeTruthy();
    expect(screen.getByTestId('share-tickets')).toBeTruthy();
    expect(screen.queryByText('http://localhost:3001/checkout/sess_1')).toBeNull();
    expect(screen.queryByText('mobileweb://checkout/sess_1')).toBeNull();
    fireEvent.press(screen.getByTestId('share-tickets-button'));
    expect(onShare).toHaveBeenCalledWith({
      webUrl: 'http://localhost:3001/checkout/sess_1',
      mobileUrl: 'mobileweb://checkout/sess_1',
    });
  });

  it('hides Share tickets when showShare is false', () => {
    render(
      <CheckoutCard
        view={{ kind: 'ready', session: activeSession, notice: null }}
        busy={false}
        onComplete={noop}
        onConfirmPrice={noop}
        shareWebUrl="http://localhost:3001/checkout/sess_1"
        shareMobileUrl="mobileweb://checkout/sess_1"
        showShare={false}
      />,
    );

    expect(screen.queryByTestId('share-tickets')).toBeNull();
  });

  it('hides Share tickets when share URLs are omitted', () => {
    render(
      <CheckoutCard
        view={{ kind: 'ready', session: activeSession, notice: null }}
        busy={false}
        onComplete={noop}
        onConfirmPrice={noop}
      />,
    );

    expect(screen.queryByTestId('share-tickets')).toBeNull();
  });
});
