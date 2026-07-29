import { colors } from '@repo/tokens';
import { Text as RNText, View } from 'react-native';

import { Text } from '../../atoms/Text';
import { useTheme } from '../../theme';
import { CHECKOUT_COPY } from './checkout.copy';

type SuperDealBannerProps = {
  testID?: string;
};

export function SuperDealBanner({ testID = 'super-deal-banner' }: SuperDealBannerProps) {
  const theme = useTheme();

  return (
    <View
      testID={testID}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.space[3],
        padding: theme.space[4],
        borderRadius: theme.radius.lg,
        backgroundColor: colors.accentMuted,
      }}
    >
      <View style={{ flex: 1, gap: theme.space[1] }}>
        <RNText
          style={{
            color: colors.accentDark,
            fontSize: theme.fontSize.base,
            fontWeight: theme.fontWeight.bold,
            lineHeight: 22,
          }}
        >
          {CHECKOUT_COPY.superDealTitle}
        </RNText>
        <Text variant="body">{CHECKOUT_COPY.superDealBody}</Text>
      </View>
      <View
        accessibilityElementsHidden
        importantForAccessibility="no"
        style={{
          width: 36,
          height: 36,
          borderRadius: theme.radius.md,
          backgroundColor: colors.accent,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <RNText style={{ color: colors.canvas, fontSize: 18, fontWeight: '700' }}>★</RNText>
      </View>
    </View>
  );
}
