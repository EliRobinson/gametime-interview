import { formatCurrency } from '@repo/utils';
import { View } from 'react-native';

import { Text } from '../atoms/Text';

type PriceRowProps = {
  amountCents: number;
  testID?: string;
};

export function PriceRow({ amountCents, testID }: PriceRowProps) {
  return (
    <View className="gap-1">
      <Text variant="muted">Total</Text>
      <Text variant="total" testID={testID}>
        {formatCurrency(amountCents)}
      </Text>
    </View>
  );
}
