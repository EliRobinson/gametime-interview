import { ActivityIndicator, View } from 'react-native';

import { Text } from './Text';

export function Spinner({ label }: { label?: string }) {
  return (
    <View className="items-center gap-3">
      <ActivityIndicator />
      {label ? <Text variant="muted">{label}</Text> : null}
    </View>
  );
}
