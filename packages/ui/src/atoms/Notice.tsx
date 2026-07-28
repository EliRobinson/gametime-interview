import { colors } from '@repo/tokens';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { useAppearance } from '../appearance';
import { Text } from './Text';

/** Soft status strip — mint tint on light; elevated surface on dark. */
export function Notice({ children, testID }: { children: ReactNode; testID?: string }) {
  const appearance = useAppearance();

  return (
    <View
      accessibilityLiveRegion="polite"
      style={{
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.accent,
        backgroundColor: appearance === 'dark' ? colors.surfaceDark : colors.accentMuted,
        paddingHorizontal: 12,
        paddingVertical: 12,
      }}
      testID={testID}
    >
      <Text variant="body">{children}</Text>
    </View>
  );
}
