import { View } from 'react-native';

import { Text } from '../../atoms/Text';
import { useTheme } from '../../theme';
import { CHECKOUT_COPY } from './checkout.copy';

type SuperDealBannerProps = {
  testID?: string;
};

export function SuperDealBanner({ testID = 'super-deal-banner' }: SuperDealBannerProps) {
  const theme = useTheme();

  return (
    <View
      testID={testID}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.space[3],
        padding: theme.space[4],
        borderRadius: theme.radius.lg,
        backgroundColor: theme.noticeBackground,
      }}
    >
      <View style={{ flex: 1, gap: theme.space[1] }}>
        <Text variant="title">{CHECKOUT_COPY.superDealTitle}</Text>
        <Text variant="body">{CHECKOUT_COPY.superDealBody}</Text>
      </View>
      <Text variant="eyebrow">★</Text>
    </View>
  );
}
