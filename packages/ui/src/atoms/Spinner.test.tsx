import { render, screen } from '@testing-library/react-native';

import { Spinner } from './Spinner';

describe('Spinner', () => {
  it('shows label when provided', () => {
    render(<Spinner label="Loading checkout" />);
    expect(screen.getByText('Loading checkout')).toBeTruthy();
  });

  it('shows optional subtitle', () => {
    render(<Spinner label="Loading checkout" subtitle="Hang tight" />);
    expect(screen.getByText('Hang tight')).toBeTruthy();
  });
});
