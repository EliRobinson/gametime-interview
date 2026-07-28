import { render, screen } from '@testing-library/react-native';
import { Text as RNText } from 'react-native';

import { ActionStack } from './ActionStack';

describe('ActionStack', () => {
  it('renders children in a vertical stack', () => {
    render(
      <ActionStack>
        <RNText>First action</RNText>
        <RNText>Second action</RNText>
      </ActionStack>,
    );
    expect(screen.getByText('First action')).toBeTruthy();
    expect(screen.getByText('Second action')).toBeTruthy();
  });
});
