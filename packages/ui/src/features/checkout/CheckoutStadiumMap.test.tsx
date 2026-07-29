import { colors } from '@repo/tokens';
import { render, screen } from '@testing-library/react-native';
import { Text as RNText } from 'react-native';

import { CheckoutStadiumMap } from './CheckoutStadiumMap';

describe('CheckoutStadiumMap', () => {
  it.each([
    {
      name: 'super deal star uses dark ink on accent green',
      bubble: { leftPct: 50, topPct: 40, isSuperDeal: true },
      expectedGlyph: '★',
      expectedColor: colors.canvas,
      expectedBackground: colors.accent,
    },
    {
      name: 'standard deal dot uses light ink on dark bubble',
      bubble: { leftPct: 30, topPct: 50, isSuperDeal: false },
      expectedGlyph: '●',
      expectedColor: colors.onDark,
      expectedBackground: colors.cta,
    },
  ])('$name', ({ bubble, expectedGlyph, expectedColor, expectedBackground }) => {
    render(<CheckoutStadiumMap bubble={bubble} />);

    const mapBubble = screen.getByTestId('checkout-map-bubble');
    expect(mapBubble.props.style).toEqual(
      expect.objectContaining({ backgroundColor: expectedBackground }),
    );

    const glyph = mapBubble.findByType(RNText);
    expect(glyph.props.children).toBe(expectedGlyph);
    expect(glyph.props.style.color).toBe(expectedColor);
  });
});
