import { Pressable, View } from 'react-native';

import { Text } from '../../atoms/Text';
import { useTheme } from '../../theme';
import { LISTINGS_COPY } from './listings.copy';
import type { ListingRowView } from './listings.view-model';

type ListingCardProps = {
  listing: ListingRowView;
  selected: boolean;
  onSelect: (listingId: string) => void;
};

export function ListingCard({ listing, selected, onSelect }: ListingCardProps) {
  const theme = useTheme();
  const isDark = theme.name === 'dark';

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
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: theme.space[3] }}>
        <Text variant="title">
          Sec {listing.section} · Row {listing.row}
        </Text>
        <Text variant="title">{listing.formattedPrice}</Text>
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
    </Pressable>
  );
}
