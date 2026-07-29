import { colors } from '@repo/tokens';
import { Pressable, Text as RNText, View } from 'react-native';

import { Text } from '../../atoms/Text';
import { useTheme } from '../../theme';
import { CHECKOUT_COPY } from './checkout.copy';
import type { CheckoutPresentation } from './checkout.view-model';

type PriceBreakdownProps = {
  presentation: CheckoutPresentation;
  /** When false, hides tickets line + promo (mobile collapsed). */
  expanded?: boolean;
  onToggleDetails?: () => void;
  showPromo?: boolean;
  testID?: string;
};

export function PriceBreakdown({
  presentation,
  expanded = true,
  onToggleDetails,
  showPromo = true,
  testID = 'checkout-price-breakdown',
}: PriceBreakdownProps) {
  const theme = useTheme();
  const seatNote = presentation.seatCount !== null ? ` · ${presentation.seatCount} seats` : '';

  return (
    <View testID={testID} style={{ gap: theme.space[2] }}>
      {onToggleDetails ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: theme.space[2],
            paddingVertical: theme.space[3],
            borderTopWidth: 1,
            borderColor: colors.border,
          }}
        >
          <RNText
            style={{
              fontSize: theme.fontSize.base,
              fontWeight: theme.fontWeight.bold,
              lineHeight: 22,
              color: theme.text,
            }}
            testID="acknowledged-price"
          >
            {presentation.formattedTotal} Total
          </RNText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={expanded ? CHECKOUT_COPY.hideDetails : CHECKOUT_COPY.showDetails}
            onPress={onToggleDetails}
            testID="toggle-price-details"
            style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space[1] }}
          >
            <RNText
              style={{
                color: colors.link,
                fontSize: theme.fontSize.base,
                fontWeight: theme.fontWeight.semibold,
              }}
            >
              {expanded ? CHECKOUT_COPY.hideDetails : CHECKOUT_COPY.showDetails}
            </RNText>
          </Pressable>
        </View>
      ) : null}

      {expanded ? (
        <View style={{ gap: theme.space[2] }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: theme.space[2],
            }}
          >
            <Text variant="body">{CHECKOUT_COPY.ticketsLabel}</Text>
            <TicketUnitPrice
              presentation={presentation}
              seatNote={seatNote}
              showTestId={!onToggleDetails}
            />
          </View>

          {showPromo && presentation.showDecorativeChrome ? (
            <Text variant="muted" testID="add-promo-code">
              {CHECKOUT_COPY.addPromoCode}
            </Text>
          ) : null}

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: theme.space[2],
            }}
          >
            <Text variant="title">{CHECKOUT_COPY.totalLabel}</Text>
            <Text variant="title" testID="checkout-total">
              {presentation.formattedTotal}
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

function TicketUnitPrice({
  presentation,
  seatNote,
  showTestId,
}: {
  presentation: CheckoutPresentation;
  seatNote: string;
  showTestId: boolean;
}) {
  const theme = useTheme();
  const hasPrevious = presentation.formattedPreviousUnitPrice !== null;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: theme.space[1],
        flexWrap: 'wrap',
        justifyContent: 'flex-end',
      }}
      testID={showTestId ? 'acknowledged-price' : undefined}
    >
      {hasPrevious ? (
        <RNText
          testID="previous-unit-price"
          style={{
            fontSize: theme.fontSize.sm,
            lineHeight: 18,
            color: theme.muted,
            textDecorationLine: 'line-through',
          }}
        >
          {presentation.formattedPreviousUnitPrice}
        </RNText>
      ) : null}
      <RNText
        style={{
          fontSize: theme.fontSize.base,
          fontWeight: theme.fontWeight.normal,
          lineHeight: 22,
          color: theme.text,
        }}
      >
        {presentation.formattedUnitPrice}
        {seatNote}
      </RNText>
    </View>
  );
}
