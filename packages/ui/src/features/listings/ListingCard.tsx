import { Pressable, View } from 'react-native';

import { Button } from '../../atoms/Button';
import { Notice } from '../../atoms/Notice';
import { Text } from '../../atoms/Text';
import { useTheme } from '../../theme';
import { LISTINGS_COPY } from './listings.copy';
import type { ListingRowView } from './listings.view-model';

type ListingCardInlineContinue = {
  busy: boolean;
  createError: string | null;
  onContinue: (listing: ListingRowView) => void;
};

type ListingCardProps = {
  listing: ListingRowView;
  selected: boolean;
  onSelect: (listingId: string) => void;
  /**
   * When provided, a selected card expands in place with Continue (mobile
   * stacked). Omit on sidebar layouts that use the sticky dock instead.
   */
  inlineContinue?: ListingCardInlineContinue;
};

export function ListingCard({ listing, selected, onSelect, inlineContinue }: ListingCardProps) {
  const theme = useTheme();
  const isDark = theme.name === 'dark';
  const showInlineActions = Boolean(inlineContinue && selected);

  return (
    <Pressable
      testID={`listing-card-${listing.listingId}`}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled: !listing.available }}
      disabled={!listing.available}
      onPress={() => onSelect(listing.listingId)}
      style={{
        opacity: listing.available ? 1 : 0.4,
        borderRadius: theme.radius.lg,
        padding: theme.space[4],
        gap: theme.space[2],
        backgroundColor: isDark ? '#1C1C20' : '#FFFFFF',
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? '#19CE85' : isDark ? '#2A2A2E' : '#DFE2E7',
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: theme.space[3],
        }}
      >
        {/* Bound the section label so long demo titles wrap instead of clipping the price. */}
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text variant="title">
            Sec {listing.section} · Row {listing.row}
          </Text>
        </View>
        <View style={{ flexShrink: 0 }}>
          <Text variant="title" testID={`listing-price-${listing.listingId}`}>
            {listing.formattedPrice}
          </Text>
        </View>
      </View>
      <Text variant="muted">
        {listing.available
          ? LISTINGS_COPY.seatsTogether(listing.seatCount)
          : LISTINGS_COPY.unavailable}
      </Text>
      {listing.isSuperDeal ? (
        <View
          style={{
            alignSelf: 'flex-start',
            backgroundColor: '#19CE85',
            borderRadius: theme.radius.md,
            paddingHorizontal: theme.space[2],
            paddingVertical: 2,
          }}
        >
          <Text variant="eyebrow">{LISTINGS_COPY.superDealBadge}</Text>
        </View>
      ) : null}

      {showInlineActions && inlineContinue ? (
        <InlineContinueActions listing={listing} {...inlineContinue} />
      ) : null}
    </Pressable>
  );
}

function InlineContinueActions({
  listing,
  busy,
  createError,
  onContinue,
}: ListingCardInlineContinue & { listing: ListingRowView }) {
  const theme = useTheme();
  const canContinue = listing.available && !busy;

  return (
    <View
      testID={`listing-card-expanded-${listing.listingId}`}
      style={{ gap: theme.space[3], marginTop: theme.space[2] }}
    >
      <Text variant="body">{LISTINGS_COPY.priceEach(listing.formattedPrice)}</Text>

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
