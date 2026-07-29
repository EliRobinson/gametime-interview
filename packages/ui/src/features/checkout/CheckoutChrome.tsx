import { colors } from '@repo/tokens';
import { View } from 'react-native';

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
      <Text variant="body">{CHECKOUT_COPY.ticketDeliveryLabel}</Text>
      <Text variant="muted">{CHECKOUT_COPY.contactEmail}</Text>
    </View>
  );
}

type CheckoutTermsProps = {
  testID?: string;
};

export function CheckoutTerms({ testID = 'checkout-terms' }: CheckoutTermsProps) {
  return (
    <Text variant="muted" testID={testID}>
      {CHECKOUT_COPY.termsPrefix}
      {CHECKOUT_COPY.termsOfUse}
      {CHECKOUT_COPY.termsAnd}
      {CHECKOUT_COPY.privacyPolicy}
    </Text>
  );
}
