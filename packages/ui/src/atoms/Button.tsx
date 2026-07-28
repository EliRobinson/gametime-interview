import { colors } from '@repo/tokens';
import type { ReactNode } from 'react';
import type { ViewStyle } from 'react-native';
import { Pressable, StyleSheet,Text as RNText } from 'react-native';

import { useAppearance } from '../appearance';

type ButtonProps = {
  onPress: () => void;
  children: ReactNode;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  testID?: string;
};

/**
 * Primary CTA: black pill on light (web), mint pill on dark (mobile) — matches Gametime.
 * Colors use token StyleSheet values so RN-web does not depend on dynamic NativeWind classes.
 */
export function Button({ onPress, children, variant = 'primary', disabled, testID }: ButtonProps) {
  const appearance = useAppearance();
  const primary = appearance === 'dark';

  const container: ViewStyle = {
    ...styles.base,
    backgroundColor:
      variant === 'primary'
        ? primary
          ? colors.accent
          : colors.cta
        : primary
          ? colors.surfaceDarkElevated
          : colors.border,
    opacity: disabled ? 0.5 : 1,
  };

  const labelColor = variant === 'primary' ? colors.onDark : primary ? colors.onDark : colors.text;

  return (
    <Pressable
      accessibilityRole="button"
      style={container}
      disabled={disabled}
      onPress={disabled ? undefined : onPress}
      testID={testID}
    >
      <RNText
        style={{
          color: labelColor,
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: 0.8,
          fontSize: 15,
        }}
      >
        {children}
      </RNText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 9999,
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
