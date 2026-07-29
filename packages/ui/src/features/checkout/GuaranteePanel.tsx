import { colors } from '@repo/tokens';
import { Text as RNText, View } from 'react-native';

import { Text } from '../../atoms/Text';
import { useTheme } from '../../theme';
import { CHECKOUT_COPY } from './checkout.copy';

type GuaranteePanelProps = {
  testID?: string;
};

export function GuaranteePanel({ testID = 'guarantee-panel' }: GuaranteePanelProps) {
  const theme = useTheme();

  return (
    <View
      testID={testID}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.space[4],
        padding: theme.space[4],
        borderRadius: theme.radius.lg,
        backgroundColor: colors.canvasLight,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View style={{ flex: 1, gap: theme.space[2] }}>
        <Text variant="title">{CHECKOUT_COPY.guaranteeTitle}</Text>
        {CHECKOUT_COPY.guaranteeItems.map((item) => (
          <Text key={item} variant="body">
            ✓ {item}
          </Text>
        ))}
      </View>
      <View
        accessibilityLabel="Gametime Guarantee"
        style={{
          width: 56,
          height: 64,
          borderRadius: theme.radius.lg,
          backgroundColor: colors.guarantee,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <RNText
          style={{
            color: colors.onDark,
            fontSize: theme.fontSize['2xl'],
            fontWeight: theme.fontWeight.bold,
          }}
        >
          ✓
        </RNText>
      </View>
    </View>
  );
}
