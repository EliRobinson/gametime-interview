import { colors } from '@repo/tokens';
import { ActivityIndicator, View } from 'react-native';

import { useAppearance } from '../appearance';
import { Text } from './Text';

/**
 * Checkout resume loading. Visual language follows Gametime's dark ticket-loading
 * screen (centered title, muted subtitle, skeleton cards) without the map UI.
 */
export function Spinner({ label }: { label?: string }) {
  const appearance = useAppearance();
  const skeletonBg = appearance === 'dark' ? colors.surfaceDarkElevated : colors.border;

  return (
    <View style={{ alignItems: 'center', gap: 16, paddingVertical: 32 }}>
      <ActivityIndicator color={colors.accent} size="large" />
      {label ? (
        <View style={{ alignItems: 'center', gap: 4, paddingHorizontal: 16 }}>
          <Text variant="title">{label}</Text>
          <Text variant="muted">So you don't have to.</Text>
        </View>
      ) : null}
      <View style={{ marginTop: 16, width: '100%', gap: 12, paddingHorizontal: 8 }}>
        <View style={{ height: 96, borderRadius: 12, backgroundColor: skeletonBg }} />
        <View style={{ height: 96, borderRadius: 12, backgroundColor: skeletonBg }} />
        <View style={{ height: 96, borderRadius: 12, backgroundColor: skeletonBg }} />
      </View>
    </View>
  );
}
