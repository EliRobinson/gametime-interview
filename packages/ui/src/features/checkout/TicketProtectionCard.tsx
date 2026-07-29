import { colors } from '@repo/tokens';
import { View } from 'react-native';

import { Text } from '../../atoms/Text';
import { useTheme } from '../../theme';
import { CHECKOUT_COPY } from './checkout.copy';

type TicketProtectionCardProps = {
  testID?: string;
};

/** Static decorative upsell — not a real purchase flow. */
export function TicketProtectionCard({
  testID = 'ticket-protection-card',
}: TicketProtectionCardProps) {
  const theme = useTheme();

  return (
    <View
      testID={testID}
      style={{
        gap: theme.space[3],
        padding: theme.space[4],
        borderRadius: theme.radius.lg,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: theme.space[3],
        }}
      >
        <View style={{ flex: 1, gap: theme.space[1] }}>
          <Text variant="title">{CHECKOUT_COPY.ticketProtectionTitle}</Text>
          <Text variant="body">{CHECKOUT_COPY.ticketProtectionPrice}</Text>
        </View>
        <View
          style={{
            paddingHorizontal: theme.space[3],
            paddingVertical: theme.space[2],
            borderRadius: theme.radius.md,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text variant="eyebrow">{CHECKOUT_COPY.ticketProtectionAdd}</Text>
        </View>
      </View>
      <Text variant="muted">
        {CHECKOUT_COPY.ticketProtectionBody}
        {CHECKOUT_COPY.ticketProtectionLearnMore}
      </Text>
      <Text variant="muted">{CHECKOUT_COPY.ticketProtectionPoweredBy}</Text>
    </View>
  );
}
