import type { CheckoutSession } from '@repo/api-contracts';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { CheckoutCard } from './CheckoutCard';
import { CHECKOUT_COPY } from './copy';

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
  it('shows price and complete purchase for active session', () => {
    render(
      <CheckoutCard
        view={{ kind: 'session', session: activeSession, notice: null }}
        busy={false}
        onComplete={noop}
        onConfirmPrice={noop}
      />,
    );

    expect(screen.getByTestId('acknowledged-price')).toBeTruthy();
    expect(screen.getByTestId('complete-button')).toBeTruthy();
    expect(screen.getByText(CHECKOUT_COPY.completePurchase)).toBeTruthy();
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

    expect(screen.getByTestId('confirm-price-button')).toBeTruthy();
    expect(screen.getByText(CHECKOUT_COPY.confirmNewPrice)).toBeTruthy();
  });

  it.each([
    { kind: 'expired' as const, title: CHECKOUT_COPY.expired.title },
    { kind: 'unavailable' as const, title: CHECKOUT_COPY.unavailable.title },
  ])('shows distinct title for $kind', ({ kind, title }) => {
    render(<CheckoutCard view={{ kind }} busy={false} onComplete={noop} onConfirmPrice={noop} />);

    expect(screen.getByText(title)).toBeTruthy();
  });

  it('shows retry button for failed session', () => {
    const failedSession: CheckoutSession = {
      ...activeSession,
      status: 'failed',
      failureReason: 'card_declined',
    };

    render(
      <CheckoutCard
        view={{ kind: 'session', session: failedSession, notice: null }}
        busy={false}
        onComplete={noop}
        onConfirmPrice={noop}
      />,
    );

    expect(screen.getByTestId('retry-button')).toBeTruthy();
    expect(screen.getByText(CHECKOUT_COPY.retry)).toBeTruthy();
  });

  it('shows spinner label for loading', () => {
    render(
      <CheckoutCard
        view={{ kind: 'loading' }}
        busy={false}
        onComplete={noop}
        onConfirmPrice={noop}
      />,
    );

    expect(screen.getByText(CHECKOUT_COPY.loading)).toBeTruthy();
  });

  it('shows price notice when provided', () => {
    render(
      <CheckoutCard
        view={{
          kind: 'session',
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
        view={{ kind: 'session', session: activeSession, notice: null }}
        busy={false}
        onComplete={onComplete}
        onConfirmPrice={noop}
      />,
    );

    fireEvent.press(screen.getByTestId('complete-button'));
    expect(onComplete).toHaveBeenCalledWith(activeSession);
  });
});
