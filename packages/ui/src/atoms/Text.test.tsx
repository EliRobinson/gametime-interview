import { render, screen } from '@testing-library/react-native';

import { Text } from './Text';

describe('Text', () => {
  it.each([
    { variant: 'title' as const, sample: 'Finish checkout' },
    { variant: 'muted' as const, sample: 'Total' },
    { variant: 'total' as const, sample: '$42.00' },
  ])('renders $variant content', ({ variant, sample }) => {
    render(<Text variant={variant}>{sample}</Text>);
    expect(screen.getByText(sample)).toBeTruthy();
  });
});
