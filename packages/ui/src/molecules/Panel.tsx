import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Text } from '../atoms/Text';
import { useTheme } from '../theme';

type PanelProps = {
  title: string;
  body: string;
  children?: ReactNode;
};

export function Panel({ title, body, children }: PanelProps) {
  const theme = useTheme();

  return (
    <View style={{ gap: theme.space[3] }}>
      <Text variant="title">{title}</Text>
      <Text variant="muted">{body}</Text>
      {children}
    </View>
  );
}
