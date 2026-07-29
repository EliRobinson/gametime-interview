import { Text as RNText, View } from 'react-native';

import { Text } from '../../atoms/Text';
import { useTheme } from '../../theme';
import type { CheckoutPresentation } from './checkout.view-model';

type EventSummaryProps = {
  presentation: CheckoutPresentation;
  /** Compact mobile row vs fuller web-style summary. */
  variant?: 'mobile' | 'web';
  testID?: string;
};

export function EventSummary({
  presentation,
  variant = 'mobile',
  testID = 'checkout-event-summary',
}: EventSummaryProps) {
  const theme = useTheme();

  if (variant === 'web') {
    return (
      <View testID={testID} style={{ gap: theme.space[2] }}>
        <Text variant="muted">
          {presentation.venue.toUpperCase()} · {presentation.city.toUpperCase()}
        </Text>
        <Text variant="title">{presentation.artist}</Text>
        <Text variant="body">{presentation.datetimeLabel}</Text>
        <Text variant="body">{presentation.seatLineWeb}</Text>
        {presentation.seatsTogetherLabel ? (
          <Text variant="muted">{presentation.seatsTogetherLabel}</Text>
        ) : null}
        <Text variant="muted">{presentation.deliveryLabel}</Text>
      </View>
    );
  }

  const seatParts = [presentation.seatLine, presentation.seatsTogetherLabel].filter(Boolean);

  return (
    <View testID={testID} style={{ gap: theme.space[1], flex: 1 }}>
      <RNText
        style={{
          fontSize: theme.fontSize.base,
          fontWeight: theme.fontWeight.bold,
          lineHeight: 22,
          color: theme.text,
        }}
      >
        {presentation.artist}
      </RNText>
      <Text variant="muted">{presentation.datetimeLabel}</Text>
      <Text variant="body">{seatParts.join(' · ')}</Text>
      <Text variant="muted">{presentation.venue}</Text>
    </View>
  );
}
