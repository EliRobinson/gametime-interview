import { colors } from '@repo/tokens';
import { Pressable, Text as RNText, View } from 'react-native';

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
        paddingVertical: theme.space[4],
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
          <RNText
            style={{
              fontSize: theme.fontSize.base,
              fontWeight: theme.fontWeight.bold,
              lineHeight: 22,
              color: theme.text,
            }}
          >
            {CHECKOUT_COPY.ticketProtectionTitle}
          </RNText>
          <Text variant="muted">{CHECKOUT_COPY.ticketProtectionPrice}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={CHECKOUT_COPY.ticketProtectionAdd}
          disabled
          style={{
            paddingHorizontal: theme.space[3],
            paddingVertical: theme.space[2],
            borderRadius: theme.radius.md,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
          }}
        >
          <Text variant="eyebrow">{CHECKOUT_COPY.ticketProtectionAdd}</Text>
        </Pressable>
      </View>
      <RNText
        style={{
          color: theme.muted,
          fontSize: theme.fontSize.base,
          lineHeight: 22,
        }}
      >
        {CHECKOUT_COPY.ticketProtectionBody}
        <RNText style={{ color: colors.link, textDecorationLine: 'underline' }}>
          {CHECKOUT_COPY.ticketProtectionLearnMore}
        </RNText>
      </RNText>
      <Text variant="muted">{CHECKOUT_COPY.ticketProtectionPoweredBy}</Text>
    </View>
  );
}
