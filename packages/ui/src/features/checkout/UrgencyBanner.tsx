import { colors } from '@repo/tokens';
import { Text as RNText, View } from 'react-native';

import { Text } from '../../atoms/Text';
import { useTheme } from '../../theme';

type UrgencyBannerProps = {
  label: string;
  /** Sticky footer uses a darker strip; summary uses the pale yellow banner. */
  variant?: 'summary' | 'footer';
  testID?: string;
};

export function UrgencyBanner({
  label,
  variant = 'summary',
  testID = 'urgency-banner',
}: UrgencyBannerProps) {
  const theme = useTheme();
  const isFooter = variant === 'footer';

  return (
    <View
      testID={testID}
      accessibilityRole="alert"
      style={{
        paddingHorizontal: theme.space[3],
        paddingVertical: theme.space[2],
        borderRadius: isFooter ? 0 : theme.radius.md,
        backgroundColor: isFooter ? colors.surfaceDark : colors.urgencyBg,
        borderWidth: isFooter ? 0 : 1,
        borderColor: colors.urgencyBorder,
        alignItems: 'center',
      }}
    >
      {isFooter ? (
        <RNText
          style={{
            color: colors.urgency,
            fontSize: theme.fontSize.base,
            fontWeight: theme.fontWeight.semibold,
            textAlign: 'center',
          }}
        >
          {label}
        </RNText>
      ) : (
        <Text variant="body">{label}</Text>
      )}
    </View>
  );
}
