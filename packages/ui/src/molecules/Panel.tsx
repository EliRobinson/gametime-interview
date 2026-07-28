import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Text } from '../atoms/Text';

type PanelProps = {
  title: string;
  body: string;
  children?: ReactNode;
};

export function Panel({ title, body, children }: PanelProps) {
  return (
    <View className="gap-3">
      <Text variant="title">{title}</Text>
      <Text variant="muted">{body}</Text>
      {children}
    </View>
  );
}
