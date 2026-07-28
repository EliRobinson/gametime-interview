import { render, screen } from '@testing-library/react-native';
import { Text as RNText } from 'react-native';

import { Panel } from './Panel';

describe('Panel', () => {
  it('renders title and body', () => {
    render(<Panel title="Finish checkout" body="Review your order before continuing." />);
    expect(screen.getByText('Finish checkout')).toBeTruthy();
    expect(screen.getByText('Review your order before continuing.')).toBeTruthy();
  });

  it('renders optional children', () => {
    render(
      <Panel title="Finish checkout" body="Review your order before continuing.">
        <RNText testID="panel-child">Extra content</RNText>
      </Panel>,
    );
    expect(screen.getByTestId('panel-child')).toBeTruthy();
  });
});
