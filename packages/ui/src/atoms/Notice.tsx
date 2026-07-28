import type { ReactNode } from 'react';
import { View } from 'react-native';

import { useTheme } from '../theme';
import { Text } from './Text';

/** Soft status strip — mint tint on light; elevated surface on dark. */
export function Notice({ children, testID }: { children: ReactNode; testID?: string }) {
  const theme = useTheme();

  return (
    <View
      accessibilityLiveRegion="polite"
      style={{
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: theme.noticeBorder,
        backgroundColor: theme.noticeBackground,
        paddingHorizontal: theme.space[3],
        paddingVertical: theme.space[3],
      }}
      testID={testID}
    >
      <Text variant="body">{children}</Text>
    </View>
  );
}
