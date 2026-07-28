import type { ReactNode } from 'react';
import { View } from 'react-native';

export function Banner({ children, testID }: { children: ReactNode; testID?: string }) {
  return (
    <View
      accessibilityRole="alert"
      className="rounded-lg border border-banner-border bg-banner p-3"
      testID={testID}
    >
      {children}
    </View>
  );
}
