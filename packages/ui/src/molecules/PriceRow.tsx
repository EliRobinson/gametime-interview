import { formatCurrency } from '@repo/utils';
import { View } from 'react-native';

import { Text } from '../atoms/Text';
import { useTheme } from '../theme';

type PriceRowProps = {
  amountCents: number;
  testID?: string;
};

export function PriceRow({ amountCents, testID }: PriceRowProps) {
  const theme = useTheme();

  return (
    <View style={{ gap: theme.space[1] }}>
      <Text variant="muted">Total</Text>
      <Text variant="total" testID={testID}>
        {formatCurrency(amountCents)}
      </Text>
    </View>
  );
}
