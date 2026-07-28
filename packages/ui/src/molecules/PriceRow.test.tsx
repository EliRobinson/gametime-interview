import { render, screen } from '@testing-library/react-native';

import { PriceRow } from './PriceRow';

describe('PriceRow', () => {
  it('shows Total and the formatted amount', () => {
    render(<PriceRow amountCents={4200} testID="acknowledged-price" />);
    expect(screen.getByText('Total')).toBeTruthy();
    expect(screen.getByText('$42.00')).toBeTruthy();
  });
});
