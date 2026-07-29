import { CHECKOUT_COPY } from '@repo/ui';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { useLayoutEffect } from 'react';

import type { CheckoutLeaveMode } from './checkout-leave-mode';
import { CheckoutLeaveModeProvider, useCheckoutLeaveMode } from './checkout-leave-mode';
import { SiteHeader } from './site-header';

const usePathname = jest.fn();

jest.mock('next/navigation', () => ({
  usePathname: () => usePathname(),
}));

function renderHeader(ui: ReactNode = <SiteHeader />) {
  return render(<CheckoutLeaveModeProvider>{ui}</CheckoutLeaveModeProvider>);
}

function SetLeaveMode({ mode }: { mode: CheckoutLeaveMode }) {
  const { setLeaveMode } = useCheckoutLeaveMode();
  useLayoutEffect(() => {
    setLeaveMode(mode);
  }, [mode, setLeaveMode]);
  return null;
}

describe('SiteHeader', () => {
  beforeEach(() => {
    usePathname.mockReset();
  });

  it.each([
    {
      name: 'checkout session route',
      pathname: '/checkout/sess_abc',
      expectLeaveControl: true,
    },
    {
      name: 'selection landing',
      pathname: '/',
      expectLeaveControl: false,
    },
  ])('leave control on $name', ({ pathname, expectLeaveControl }) => {
    usePathname.mockReturnValue(pathname);

    renderHeader();

    expect(screen.getByLabelText('Gametime home')).toBeInTheDocument();
    expect(screen.getByText(CHECKOUT_COPY.pageTitle)).toBeInTheDocument();

    const leaveControl = screen.queryByTestId('checkout-cancel');
    if (expectLeaveControl) {
      expect(leaveControl).toBeInTheDocument();
      expect(leaveControl).toHaveAttribute('href', '/');
      expect(leaveControl).toHaveAccessibleName(CHECKOUT_COPY.cancelAriaLabel);
      expect(leaveControl).toHaveTextContent(`‹${CHECKOUT_COPY.cancelLabel}`);
    } else {
      expect(leaveControl).not.toBeInTheDocument();
    }
  });

  it('labels the leave control Done after a successful purchase', () => {
    usePathname.mockReturnValue('/checkout/sess_abc');

    renderHeader(
      <>
        <SetLeaveMode mode="done" />
        <SiteHeader />
      </>,
    );

    const leaveControl = screen.getByTestId('checkout-cancel');
    expect(leaveControl).toHaveAccessibleName(CHECKOUT_COPY.doneAriaLabel);
    expect(leaveControl).toHaveTextContent(`‹${CHECKOUT_COPY.doneLabel}`);
  });
});
