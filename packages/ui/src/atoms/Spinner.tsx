import { ActivityIndicator, View } from 'react-native';

import { brandAccent, useTheme } from '../theme';
import { Text } from './Text';

/**
 * Loading indicator with optional label/subtitle. Product copy belongs at the
 * call site (feature), not inside this atom.
 */
export function Spinner({ label, subtitle }: { label?: string; subtitle?: string }) {
  const theme = useTheme();

  return (
    <View
      style={{
        alignItems: 'center',
        gap: theme.space[4],
        paddingVertical: theme.space[8],
      }}
    >
      <ActivityIndicator color={brandAccent} size="large" />
      {label ? (
        <View
          style={{
            alignItems: 'center',
            gap: theme.space[1],
            paddingHorizontal: theme.space[4],
          }}
        >
          <Text variant="title">{label}</Text>
          {subtitle ? <Text variant="muted">{subtitle}</Text> : null}
        </View>
      ) : null}
      <View
        style={{
          marginTop: theme.space[4],
          width: '100%',
          gap: theme.space[3],
          paddingHorizontal: theme.space[2],
        }}
      >
        <View
          style={{
            height: theme.space[8] * 3,
            borderRadius: theme.radius.lg,
            backgroundColor: theme.skeleton,
          }}
        />
        <View
          style={{
            height: theme.space[8] * 3,
            borderRadius: theme.radius.lg,
            backgroundColor: theme.skeleton,
          }}
        />
        <View
          style={{
            height: theme.space[8] * 3,
            borderRadius: theme.radius.lg,
            backgroundColor: theme.skeleton,
          }}
        />
      </View>
    </View>
  );
}
