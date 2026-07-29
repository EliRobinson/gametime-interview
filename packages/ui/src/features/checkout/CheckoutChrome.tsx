import { colors } from '@repo/tokens';
import { Text as RNText, View } from 'react-native';

import { Text } from '../../atoms/Text';
import { useTheme } from '../../theme';
import { CHECKOUT_COPY } from './checkout.copy';

type ContactRowProps = {
  testID?: string;
};

export function ContactRow({ testID = 'checkout-contact-row' }: ContactRowProps) {
  const theme = useTheme();

  return (
    <View
      testID={testID}
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: theme.space[3],
        paddingVertical: theme.space[3],
      }}
    >
      <Text variant="title">{CHECKOUT_COPY.contactLabel}</Text>
      <Text variant="body">{CHECKOUT_COPY.contactEmail}</Text>
    </View>
  );
}

type TicketDeliveryRowProps = {
  testID?: string;
};

export function TicketDeliveryRow({ testID = 'ticket-delivery-row' }: TicketDeliveryRowProps) {
  const theme = useTheme();

  return (
    <View
      testID={testID}
      accessibilityRole="summary"
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: theme.space[3],
        paddingVertical: theme.space[4],
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: colors.border,
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
          {CHECKOUT_COPY.ticketDeliveryLabel}
        </RNText>
        <Text variant="muted">{CHECKOUT_COPY.contactEmail}</Text>
      </View>
      <RNText
        accessibilityElementsHidden
        importantForAccessibility="no"
        style={{ color: theme.muted, fontSize: theme.fontSize['2xl'] }}
      >
        ›
      </RNText>
    </View>
  );
}

type CheckoutTermsProps = {
  testID?: string;
};

export function CheckoutTerms({ testID = 'checkout-terms' }: CheckoutTermsProps) {
  const theme = useTheme();

  return (
    <RNText
      testID={testID}
      style={{
        color: theme.muted,
        fontSize: theme.fontSize.sm,
        lineHeight: 20,
        textAlign: 'center',
      }}
    >
      {CHECKOUT_COPY.termsPrefix}
      <RNText style={{ color: colors.link, textDecorationLine: 'underline' }}>
        {CHECKOUT_COPY.termsOfUse}
      </RNText>
      {CHECKOUT_COPY.termsAnd}
      <RNText style={{ color: colors.link, textDecorationLine: 'underline' }}>
        {CHECKOUT_COPY.privacyPolicy}
      </RNText>
    </RNText>
  );
}
