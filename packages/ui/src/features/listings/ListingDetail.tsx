import { View } from 'react-native';

import { Button } from '../../atoms/Button';
import { Notice } from '../../atoms/Notice';
import { Text } from '../../atoms/Text';
import { useTheme } from '../../theme';
import { LISTINGS_COPY } from './listings.copy';
import type { EventFixture, ListingRowView } from './listings.view-model';

type ListingDetailProps = {
  event: EventFixture;
  listing: ListingRowView | null;
  busy: boolean;
  createError: string | null;
  onContinue: (listing: ListingRowView) => void;
};

export function ListingDetail({
  event,
  listing,
  busy,
  createError,
  onContinue,
}: ListingDetailProps) {
  const theme = useTheme();
  const isDark = theme.name === 'dark';

  if (!listing) {
    return (
      <View
        testID="listing-detail-empty"
        style={{
          gap: theme.space[3],
          padding: theme.space[5],
          borderRadius: theme.radius.lg,
          backgroundColor: isDark ? '#1C1C20' : '#FFFFFF',
        }}
      >
        <Text variant="eyebrow">
          {event.artist} · {event.datetimeLabel}
        </Text>
        <Text variant="muted">{LISTINGS_COPY.selectPrompt}</Text>
        <Button testID="listing-continue" variant="primary" disabled onPress={() => {}}>
          {LISTINGS_COPY.continue}
        </Button>
      </View>
    );
  }

  const canContinue = listing.available && !busy;

  return (
    <View
      testID="listing-detail"
      style={{
        gap: theme.space[4],
        padding: theme.space[5],
        borderRadius: theme.radius.lg,
        backgroundColor: isDark ? '#1C1C20' : '#FFFFFF',
      }}
    >
      <Text variant="eyebrow">
        {event.artist} · {event.city}, {event.venue}
      </Text>
      <Text variant="muted">{event.datetimeLabel}</Text>

      {listing.isSuperDeal ? (
        <View
          style={{
            alignSelf: 'flex-start',
            backgroundColor: '#19CE85',
            borderRadius: theme.radius.md,
            paddingHorizontal: theme.space[2],
            paddingVertical: theme.space[1],
          }}
        >
          <Text variant="eyebrow">{LISTINGS_COPY.superDealBadge}</Text>
        </View>
      ) : null}

      {listing.urgencyTicketsLeft !== undefined ? (
        <View
          style={{
            backgroundColor: '#FFF8DC',
            borderRadius: theme.radius.md,
            padding: theme.space[3],
          }}
        >
          <Text variant="body">{LISTINGS_COPY.urgency}</Text>
        </View>
      ) : null}

      {listing.isSuperDeal ? (
        <Notice testID="super-deal-notice">
          {`${LISTINGS_COPY.superDealTitle} ${LISTINGS_COPY.superDealBody}`}
        </Notice>
      ) : null}

      <Text variant="title">
        Section {listing.section}, Row {listing.row}
      </Text>
      <Text variant="body">{LISTINGS_COPY.priceEach(listing.formattedPrice)}</Text>
      <Text variant="muted">{LISTINGS_COPY.seatsTogether(listing.seatCount)}</Text>

      {createError ? <Notice testID="listing-create-error">{createError}</Notice> : null}

      <Button
        testID="listing-continue"
        variant="primary"
        disabled={!canContinue}
        onPress={() => onContinue(listing)}
      >
        {busy ? LISTINGS_COPY.creating : LISTINGS_COPY.continue}
      </Button>
    </View>
  );
}
