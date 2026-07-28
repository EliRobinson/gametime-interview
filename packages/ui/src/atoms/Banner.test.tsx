import { render, screen } from '@testing-library/react-native';

import { Banner } from './Banner';

describe('Banner', () => {
  it('has alert accessibility role', () => {
    render(<Banner testID="banner">Session expired</Banner>);
    expect(screen.getByTestId('banner').props.accessibilityRole).toBe('alert');
  });
});
