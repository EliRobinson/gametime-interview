import type { ReactNode } from 'react';
import { Pressable, Text as RNText } from 'react-native';

type ButtonProps = {
  onPress: () => void;
  children: ReactNode;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  testID?: string;
};

// NativeWind's `className` works identically here whether this renders
// on iOS, Android, or web (react-native-web) — one component, one style
// language, three platforms.
export function Button({ onPress, children, variant = 'primary', disabled, testID }: ButtonProps) {
  const base = 'rounded-lg px-4 py-3 items-center justify-center';
  const styles = variant === 'primary' ? `${base} bg-primary` : `${base} bg-border`;
  const textStyles =
    variant === 'primary' ? 'text-surface font-semibold' : 'text-ink font-semibold';
  const disabledClass = disabled ? ' opacity-50' : '';

  return (
    <Pressable
      accessibilityRole="button"
      className={`${styles}${disabledClass}`}
      disabled={disabled}
      onPress={disabled ? undefined : onPress}
      testID={testID}
    >
      <RNText className={textStyles}>{children}</RNText>
    </Pressable>
  );
}
