import { render, screen } from '@testing-library/react-native';

import { Notice } from './Notice';

describe('Notice', () => {
  it('renders children', () => {
    render(<Notice>Your cart is reserved</Notice>);
    expect(screen.getByText('Your cart is reserved')).toBeTruthy();
  });
});
