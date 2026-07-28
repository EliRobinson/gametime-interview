import type { ReactNode } from 'react';
import type { TextStyle, ViewStyle } from 'react-native';
import { Pressable, Text as RNText } from 'react-native';

import { useTheme } from '../theme';

type ButtonProps = {
  onPress: () => void;
  children: ReactNode;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  testID?: string;
};

/**
 * Primary CTA: black pill on light (web), mint pill on dark (mobile).
 * Colors come from the active Theme — StyleSheet only, no NativeWind in `@repo/ui`.
 */
export function Button({ onPress, children, variant = 'primary', disabled, testID }: ButtonProps) {
  const theme = useTheme();
  const isPrimary = variant === 'primary';

  const container: ViewStyle = {
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.space[5],
    paddingVertical: theme.space[4],
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: isPrimary ? theme.ctaBackground : theme.secondaryBackground,
    opacity: disabled ? 0.5 : 1,
  };

  const label: TextStyle = {
    color: isPrimary ? theme.ctaLabel : theme.secondaryLabel,
    fontWeight: theme.fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontSize: theme.fontSize.md,
  };

  return (
    <Pressable
      accessibilityRole="button"
      style={container}
      disabled={disabled}
      onPress={disabled ? undefined : onPress}
      testID={testID}
    >
      <RNText style={label}>{children}</RNText>
    </Pressable>
  );
}
