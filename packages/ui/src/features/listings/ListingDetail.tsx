import { View } from 'react-native';

import { Button } from '../../atoms/Button';
import { Notice } from '../../atoms/Notice';
import { Text } from '../../atoms/Text';
import { useTheme } from '../../theme';
import { LISTINGS_COPY } from './listings.copy';
import type { EventFixture, ListingRowView } from './listings.view-model';

type SelectionEventHeaderProps = {
  event: EventFixture;
};

/** Compact event chrome — fixed height so selection changes never shift the list. */
export function SelectionEventHeader({ event }: SelectionEventHeaderProps) {
  const theme = useTheme();
  const isDark = theme.name === 'dark';

  return (
    <View
      testID="selection-event-header"
      style={{
        gap: theme.space[1],
        paddingHorizontal: theme.space[5],
        paddingVertical: theme.space[4],
        borderRadius: theme.radius.lg,
        backgroundColor: isDark ? '#1C1C20' : '#FFFFFF',
      }}
    >
      <Text variant="eyebrow">
        {event.artist} · {event.city}, {event.venue}
      </Text>
      <Text variant="muted">{event.datetimeLabel}</Text>
    </View>
  );
}

type ListingDetailProps = {
  listing: ListingRowView | null;
  busy: boolean;
  createError: string | null;
  onContinue: (listing: ListingRowView) => void;
};

/**
 * Sticky selection dock. Keeps Continue + selection summary pinned so list
 * cards stay put when the user picks a listing (instead of expanding a panel
 * above the list and shoving content down).
 */
export function ListingDetail({ listing, busy, createError, onContinue }: ListingDetailProps) {
  const theme = useTheme();
  const isDark = theme.name === 'dark';

  const shellStyle = {
    gap: theme.space[3],
    padding: theme.space[5],
    borderRadius: theme.radius.lg,
    backgroundColor: isDark ? '#1C1C20' : '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: isDark ? '#2A2A2E' : '#DFE2E7',
    flexShrink: 0,
  } as const;

  if (!listing) {
    return (
      <View testID="listing-detail-empty" style={shellStyle}>
        <Text variant="muted">{LISTINGS_COPY.selectPrompt}</Text>
        <Button testID="listing-continue" variant="primary" disabled onPress={() => {}}>
          {LISTINGS_COPY.continue}
        </Button>
      </View>
    );
  }

  const canContinue = listing.available && !busy;

  return (
    <View testID="listing-detail" style={shellStyle}>
      <View style={{ gap: theme.space[2] }}>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: theme.space[2],
          }}
        >
          <Text variant="title">
            Sec {listing.section} · Row {listing.row}
          </Text>
          {listing.isSuperDeal ? (
            <View
              style={{
                backgroundColor: '#19CE85',
                borderRadius: theme.radius.md,
                paddingHorizontal: theme.space[2],
                paddingVertical: 2,
              }}
            >
              <Text variant="eyebrow">{LISTINGS_COPY.superDealBadge}</Text>
            </View>
          ) : null}
        </View>
        <Text variant="body">{LISTINGS_COPY.priceEach(listing.formattedPrice)}</Text>
        <Text variant="muted">{LISTINGS_COPY.seatsTogether(listing.seatCount)}</Text>
      </View>

      {listing.isSuperDeal ? (
        <Notice testID="super-deal-notice">
          {`${LISTINGS_COPY.superDealTitle} ${LISTINGS_COPY.superDealBody}`}
        </Notice>
      ) : null}

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
