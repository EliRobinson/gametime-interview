import type { ReactNode } from 'react';
import { View } from 'react-native';

import { useTheme } from '../theme';

/** Scarcity / alert strip — pale yellow like Gametime's "Only N tickets left" bar. */
export function Banner({ children, testID }: { children: ReactNode; testID?: string }) {
  const theme = useTheme();

  return (
    <View
      accessibilityRole="alert"
      style={{
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: theme.bannerBorder,
        backgroundColor: theme.bannerBackground,
        paddingHorizontal: theme.space[3],
        paddingVertical: theme.space[3],
        gap: theme.space[2],
      }}
      testID={testID}
    >
      {children}
    </View>
  );
}
