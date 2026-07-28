import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Text } from './Text';

export function Notice({ children, testID }: { children: ReactNode; testID?: string }) {
  return (
    <View
      accessibilityLiveRegion="polite"
      className="rounded-lg border border-notice-border p-3"
      testID={testID}
    >
      <Text variant="body">{children}</Text>
    </View>
  );
}
