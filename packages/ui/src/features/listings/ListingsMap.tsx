import { colors } from '@repo/tokens';
import { Pressable, Text as RNText, View } from 'react-native';

import { useTheme } from '../../theme';
import type { ListingRowView } from './listings.view-model';

type ListingsMapProps = {
  listings: ListingRowView[];
  selectedListingId: string | null;
  onSelect: (listingId: string) => void;
};

/**
 * Static stadium backdrop with price bubbles. Not an interactive map engine —
 * bubbles are positioned from fixture percentages.
 */
export function ListingsMap({ listings, selectedListingId, onSelect }: ListingsMapProps) {
  const theme = useTheme();
  const isDark = theme.name === 'dark';

  return (
    <View
      testID="listings-map"
      style={{
        flex: 1,
        minHeight: 280,
        borderRadius: theme.radius.lg,
        overflow: 'hidden',
        backgroundColor: isDark ? colors.stadiumMapBgDark : colors.stadiumMapBg,
        borderWidth: 1,
        borderColor: isDark ? colors.surfaceDarkElevated : colors.border,
      }}
    >
      <StadiumSchematic isDark={isDark} />
      {listings.map((listing) => {
        const selected = listing.listingId === selectedListingId;
        const bubbleColor = listing.isSuperDeal
          ? colors.accent
          : isDark
            ? colors.surfaceDark
            : colors.cta;
        const labelColor = colors.onDark;

        return (
          <Pressable
            key={listing.listingId}
            testID={`map-bubble-${listing.listingId}`}
            accessibilityRole="button"
            accessibilityState={{ selected, disabled: !listing.available }}
            accessibilityLabel={`Section ${listing.section}, ${listing.formattedPrice}`}
            disabled={!listing.available}
            onPress={() => onSelect(listing.listingId)}
            style={{
              position: 'absolute',
              left: `${listing.bubble.leftPct}%`,
              top: `${listing.bubble.topPct}%`,
              transform: [{ translateX: -28 }, { translateY: -14 }],
              opacity: listing.available ? 1 : 0.35,
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 999,
              backgroundColor: bubbleColor,
              borderWidth: selected ? 2 : 0,
              borderColor: colors.link,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
            }}
          >
            {listing.isSuperDeal ? (
              <RNText style={{ color: labelColor, fontSize: 10 }}>★</RNText>
            ) : null}
            <RNText style={{ color: labelColor, fontWeight: '700', fontSize: 12 }}>
              {listing.formattedPrice.replace(/\.00$/, '')}
            </RNText>
          </Pressable>
        );
      })}
    </View>
  );
}

function StadiumSchematic({ isDark }: { isDark: boolean }) {
  const bowl = isDark ? colors.stadiumBowlDark : colors.stadiumBowl;
  const field = isDark ? colors.stadiumFieldDark : colors.stadiumField;
  const stage = isDark ? colors.surfaceDarkElevated : colors.stadiumStage;

  return (
    <View
      style={{
        position: 'absolute',
        top: 24,
        right: 24,
        bottom: 24,
        left: 24,
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      <View
        style={{
          width: '88%',
          height: '78%',
          borderRadius: 999,
          backgroundColor: bowl,
          opacity: 0.85,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            width: '42%',
            height: '58%',
            borderRadius: 16,
            backgroundColor: field,
            alignItems: 'flex-start',
            justifyContent: 'center',
            paddingLeft: 8,
          }}
        >
          <View
            style={{
              width: 18,
              height: '70%',
              borderRadius: 4,
              backgroundColor: stage,
            }}
          />
        </View>
      </View>
    </View>
  );
}
