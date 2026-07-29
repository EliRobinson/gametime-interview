import { colors } from '@repo/tokens';
import { Image, Pressable, Text as RNText, View } from 'react-native';

import { useTheme } from '../../theme';
import { stadiumMapImageUrl } from '../checkout/stadiumMapImage.util';
import type { ListingRowView } from './listings.view-model';

type ListingsMapProps = {
  listings: ListingRowView[];
  selectedListingId: string | null;
  onSelect: (listingId: string) => void;
  /** CDN encode width — selection map is large, so default high. */
  imageWidth?: number;
};

/**
 * Static stadium backdrop with price bubbles. Not an interactive map engine —
 * bubbles are positioned from fixture percentages over the Gametime venue image.
 */
export function ListingsMap({
  listings,
  selectedListingId,
  onSelect,
  imageWidth = 1280,
}: ListingsMapProps) {
  const theme = useTheme();
  const isDark = theme.name === 'dark';

  return (
    <View
      testID="listings-map"
      style={{
        display: 'flex',
        flex: 1,
        alignSelf: 'stretch',
        minHeight: 0,
        position: 'relative',
        borderRadius: theme.radius.lg,
        overflow: 'hidden',
        backgroundColor: isDark ? colors.stadiumMapBgDark : colors.stadiumMapBg,
        borderWidth: 1,
        borderColor: isDark ? colors.surfaceDarkElevated : colors.border,
      }}
    >
      <Image
        testID="listings-stadium-image"
        accessibilityIgnoresInvertColors
        source={{ uri: stadiumMapImageUrl(imageWidth) }}
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
        resizeMode="cover"
      />
      {listings.map((listing) => {
        const selected = listing.listingId === selectedListingId;
        const bubbleColor = listing.isSuperDeal
          ? colors.accent
          : isDark
            ? colors.surfaceDark
            : colors.cta;
        // Accent green fails WCAG with light glyphs (~2:1); dark ink clears AAA.
        const labelColor = listing.isSuperDeal ? colors.canvas : colors.onDark;

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
              borderWidth: 2,
              borderColor: selected ? colors.link : 'transparent',
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
