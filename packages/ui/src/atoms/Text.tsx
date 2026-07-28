import { colors } from '@repo/tokens';
import type { ReactNode } from 'react';
import type { TextStyle } from 'react-native';
import { Text as RNText } from 'react-native';

import { useAppearance } from '../appearance';

export type TextVariant = 'title' | 'body' | 'muted' | 'total' | 'eyebrow';

const baseByVariant: Record<TextVariant, TextStyle> = {
  title: { fontSize: 24, fontWeight: '700', lineHeight: 30 },
  body: { fontSize: 16, fontWeight: '400', lineHeight: 22 },
  muted: { fontSize: 16, fontWeight: '400', lineHeight: 22 },
  total: { fontSize: 36, fontWeight: '700', lineHeight: 42 },
  eyebrow: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
};

export function Text({
  variant,
  children,
  testID,
}: {
  variant: TextVariant;
  children: ReactNode;
  testID?: string;
}) {
  const appearance = useAppearance();
  const color =
    variant === 'muted' ? colors.muted : appearance === 'dark' ? colors.onDark : colors.text;

  return (
    <RNText style={[baseByVariant[variant], { color }]} testID={testID}>
      {children}
    </RNText>
  );
}
