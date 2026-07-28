import { colors } from '@repo/tokens';
import type { ReactNode } from 'react';
import { View } from 'react-native';

/** Scarcity / alert strip — pale yellow like Gametime's "Only N tickets left" bar. */
export function Banner({ children, testID }: { children: ReactNode; testID?: string }) {
  return (
    <View
      accessibilityRole="alert"
      style={{
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.bannerBorder,
        backgroundColor: colors.bannerBg,
        paddingHorizontal: 12,
        paddingVertical: 12,
        gap: 8,
      }}
      testID={testID}
    >
      {children}
    </View>
  );
}
