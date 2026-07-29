import { colors } from '@repo/tokens';
import { View } from 'react-native';

import { Text } from '../../atoms/Text';
import { useTheme } from '../../theme';
import type { CheckoutMapBubble } from './checkout.view-model';

type CheckoutStadiumMapProps = {
  bubble: CheckoutMapBubble | null;
  testID?: string;
};

/**
 * Static stadium schematic with an optional selected-section bubble.
 * Same spirit as listings map — not an interactive map engine.
 */
export function CheckoutStadiumMap({
  bubble,
  testID = 'checkout-stadium-map',
}: CheckoutStadiumMapProps) {
  const theme = useTheme();

  return (
    <View
      testID={testID}
      style={{
        height: 160,
        borderRadius: theme.radius.lg,
        overflow: 'hidden',
        backgroundColor: colors.stadiumMapBg,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <StadiumSchematic />
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
          <Text variant="eyebrow">{bubble.isSuperDeal ? '★' : '●'}</Text>
        </View>
      ) : null}
    </View>
  );
}

function StadiumSchematic() {
  return (
    <View
      style={{
        position: 'absolute',
        top: 16,
        right: 16,
        bottom: 16,
        left: 16,
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      <View
        style={{
          width: '88%',
          height: '78%',
          borderRadius: 999,
          backgroundColor: colors.stadiumBowl,
          opacity: 0.85,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            width: '42%',
            height: '58%',
            borderRadius: 16,
            backgroundColor: colors.stadiumField,
            alignItems: 'flex-start',
            justifyContent: 'center',
            paddingLeft: 8,
          }}
        >
          <View
            style={{
              width: 18,
              height: '70%',
              borderRadius: 4,
              backgroundColor: colors.stadiumStage,
            }}
          />
        </View>
      </View>
    </View>
  );
}
