import type { ReactNode } from 'react';
import type { TextStyle } from 'react-native';
import { Text as RNText } from 'react-native';

import { useTheme } from '../theme';

export type TextVariant = 'title' | 'body' | 'muted' | 'total' | 'eyebrow';

export function Text({
  variant,
  children,
  testID,
}: {
  variant: TextVariant;
  children: ReactNode;
  testID?: string;
}) {
  const theme = useTheme();

  const variantStyle: Record<TextVariant, TextStyle> = {
    title: {
      fontSize: theme.fontSize['2xl'],
      fontWeight: theme.fontWeight.bold,
      lineHeight: 30,
      color: theme.text,
    },
    body: {
      fontSize: theme.fontSize.base,
      fontWeight: theme.fontWeight.normal,
      lineHeight: 22,
      color: theme.text,
    },
    muted: {
      fontSize: theme.fontSize.base,
      fontWeight: theme.fontWeight.normal,
      lineHeight: 22,
      color: theme.muted,
    },
    total: {
      fontSize: theme.fontSize['4xl'],
      fontWeight: theme.fontWeight.bold,
      lineHeight: 42,
      color: theme.text,
    },
    eyebrow: {
      fontSize: theme.fontSize.xs,
      fontWeight: theme.fontWeight.semibold,
      lineHeight: 16,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      color: theme.text,
    },
  };

  return (
    <RNText style={variantStyle[variant]} testID={testID}>
      {children}
    </RNText>
  );
}
