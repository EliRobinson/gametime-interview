import type { ReactNode } from 'react';
import { Text as RNText } from 'react-native';

const variantClass: Record<'title' | 'body' | 'muted' | 'total' | 'eyebrow', string> = {
  title: 'text-2xl font-bold text-ink',
  body: 'text-base text-ink',
  muted: 'text-base text-muted',
  total: 'text-4xl font-bold text-ink',
  eyebrow: 'text-sm uppercase tracking-wide text-muted',
};

export type TextVariant = keyof typeof variantClass;

export function Text({
  variant,
  children,
  testID,
}: {
  variant: TextVariant;
  children: ReactNode;
  testID?: string;
}) {
  return (
    <RNText className={variantClass[variant]} testID={testID}>
      {children}
    </RNText>
  );
}
