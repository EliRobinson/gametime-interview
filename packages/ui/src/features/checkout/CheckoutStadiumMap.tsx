import { colors } from '@repo/tokens';
import { Image, Text as RNText, View } from 'react-native';

import { useTheme } from '../../theme';
import type { CheckoutMapBubble } from './checkout.view-model';
import { stadiumMapImageUrl } from './stadiumMapImage.util';

type CheckoutStadiumMapProps = {
  bubble: CheckoutMapBubble | null;
  testID?: string;
  /** CDN encode width — bump for larger surfaces. */
  imageWidth?: number;
};

/**
 * Static stadium map with an optional selected-section bubble.
 * Uses Gametime's venue image CDN; not an interactive map engine.
 */
export function CheckoutStadiumMap({
  bubble,
  testID = 'checkout-stadium-map',
  imageWidth = 768,
}: CheckoutStadiumMapProps) {
  const theme = useTheme();
  // Accent green fails WCAG with light glyphs (~2:1); dark ink clears AAA.
  const glyphColor = bubble?.isSuperDeal ? colors.canvas : colors.onDark;

  return (
    <View
      testID={testID}
      style={{
        height: 220,
        borderRadius: theme.radius.lg,
        overflow: 'hidden',
        backgroundColor: colors.stadiumMapBg,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Image
        accessibilityIgnoresInvertColors
        source={{ uri: stadiumMapImageUrl(imageWidth) }}
        style={{ width: '100%', height: '100%' }}
        resizeMode="cover"
      />
      {bubble ? (
        <View
          testID="checkout-map-bubble"
          style={{
            position: 'absolute',
            left: `${bubble.leftPct}%`,
            top: `${bubble.topPct}%`,
            transform: [{ translateX: -20 }, { translateY: -12 }],
            paddingHorizontal: theme.space[2],
            paddingVertical: theme.space[1],
            borderRadius: theme.radius.full,
            backgroundColor: bubble.isSuperDeal ? colors.accent : colors.cta,
            borderWidth: 2,
            borderColor: colors.link,
          }}
        >
          <RNText
            style={{
              color: glyphColor,
              fontSize: theme.fontSize.xs,
              fontWeight: theme.fontWeight.semibold,
            }}
          >
            {bubble.isSuperDeal ? '★' : '●'}
          </RNText>
        </View>
      ) : null}
    </View>
  );
}
