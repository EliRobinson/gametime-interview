import { fireEvent, render, screen } from '@testing-library/react-native';

import { Button } from './Button';

describe('Button', () => {
  it('renders its label and handles press', () => {
    const onPress = jest.fn();
    render(<Button onPress={onPress}>Continue</Button>);

    expect(screen.getByText('Continue')).toBeTruthy();

    fireEvent.press(screen.getByText('Continue'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not fire onPress when disabled', () => {
    const onPress = jest.fn();
    render(
      <Button disabled onPress={onPress}>
        Continue
      </Button>,
    );

    fireEvent.press(screen.getByText('Continue'));
    expect(onPress).not.toHaveBeenCalled();
  });
});
