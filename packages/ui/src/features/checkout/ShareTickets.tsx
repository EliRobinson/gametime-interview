import { View } from 'react-native';

import { Button } from '../../atoms/Button';
import { Text } from '../../atoms/Text';
import { useTheme } from '../../theme';
import { CHECKOUT_COPY } from './checkout.copy';

type ShareTicketsProps = {
  webUrl: string;
  mobileUrl: string;
  onShare?: (payload: { webUrl: string; mobileUrl: string }) => void;
  testID?: string;
};

/** Secondary control to copy/share resume links — URLs stay off-screen. */
export function ShareTickets({
  webUrl,
  mobileUrl,
  onShare,
  testID = 'share-tickets',
}: ShareTicketsProps) {
  const theme = useTheme();

  return (
    <View style={{ gap: theme.space[2] }} testID={testID}>
      <Text variant="muted">{CHECKOUT_COPY.shareTicketsHint}</Text>
      <Button
        testID="share-tickets-button"
        variant="secondary"
        onPress={() => onShare?.({ webUrl, mobileUrl })}
      >
        {CHECKOUT_COPY.shareTickets}
      </Button>
    </View>
  );
}
