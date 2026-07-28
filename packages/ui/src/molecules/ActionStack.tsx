import type { ReactNode } from 'react';
import { View } from 'react-native';

type ActionStackProps = {
  children: ReactNode;
};

export function ActionStack({ children }: ActionStackProps) {
  return <View className="gap-4">{children}</View>;
}
