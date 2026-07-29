import { CHECKOUT_COPY } from '@repo/ui';
import { render, screen } from '@testing-library/react';

import { SiteHeader } from './site-header';

const usePathname = jest.fn();

jest.mock('next/navigation', () => ({
  usePathname: () => usePathname(),
}));

describe('SiteHeader', () => {
  beforeEach(() => {
    usePathname.mockReset();
  });

  it.each([
    {
      name: 'checkout session route',
      pathname: '/checkout/sess_abc',
      expectCancel: true,
    },
    {
      name: 'selection landing',
      pathname: '/',
      expectCancel: false,
    },
  ])('cancel control on $name', ({ pathname, expectCancel }) => {
    usePathname.mockReturnValue(pathname);

    render(<SiteHeader />);

    expect(screen.getByLabelText('Gametime home')).toBeInTheDocument();
    expect(screen.getByText(CHECKOUT_COPY.pageTitle)).toBeInTheDocument();

    const cancel = screen.queryByTestId('checkout-cancel');
    if (expectCancel) {
      expect(cancel).toBeInTheDocument();
      expect(cancel).toHaveAttribute('href', '/');
      expect(cancel).toHaveAccessibleName(CHECKOUT_COPY.cancelAriaLabel);
      expect(cancel).toHaveTextContent(`‹${CHECKOUT_COPY.cancelLabel}`);
    } else {
      expect(cancel).not.toBeInTheDocument();
    }
  });
});
