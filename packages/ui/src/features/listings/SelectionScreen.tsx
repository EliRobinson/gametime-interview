import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { Button } from '../../atoms/Button';
import { Spinner } from '../../atoms/Spinner';
import { Text } from '../../atoms/Text';
import type { ThemeName } from '../../theme';
import { ThemeProvider, useTheme } from '../../theme';
import { ListingCard } from './ListingCard';
import { ListingDetail } from './ListingDetail';
import { LISTINGS_COPY } from './listings.copy';
import type { ListingRowView, SelectionViewModel } from './listings.view-model';
import { ListingsMap } from './ListingsMap';

type SelectionScreenProps = {
  view: SelectionViewModel | null;
  loading: boolean;
  loadError: boolean;
  busy: boolean;
  createError: string | null;
  onRetry: () => void;
  onContinue: (listing: ListingRowView) => void;
  /** Defaults to light (web). Pass `dark` for mobile. */
  theme?: ThemeName;
  /** Stack detail above map (mobile) vs sidebar (web). */
  layout?: 'sidebar' | 'stacked';
};

export function SelectionScreen({
  view,
  loading,
  loadError,
  busy,
  createError,
  onRetry,
  onContinue,
  theme = 'light',
  layout = 'sidebar',
}: SelectionScreenProps) {
  return (
    <ThemeProvider theme={theme}>
      <SelectionScreenBody
        view={view}
        loading={loading}
        loadError={loadError}
        busy={busy}
        createError={createError}
        onRetry={onRetry}
        onContinue={onContinue}
        layout={layout}
      />
    </ThemeProvider>
  );
}

function SelectionScreenBody({
  view,
  loading,
  loadError,
  busy,
  createError,
  onRetry,
  onContinue,
  layout,
}: Omit<SelectionScreenProps, 'theme'>) {
  const theme = useTheme();
  const isDark = theme.name === 'dark';
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);

  const selectedListing = useMemo(() => {
    if (!view) return null;
    return view.listings.find((listing) => listing.listingId === selectedListingId) ?? null;
  }, [selectedListingId, view]);

  if (loading) {
    return <Spinner label="Loading listings" subtitle="Finding seats for this event." />;
  }

  if (loadError || !view) {
    return (
      <View
        testID="listings-load-error"
        style={{ gap: theme.space[4], padding: theme.space[6], alignItems: 'center' }}
      >
        <Text variant="body">{LISTINGS_COPY.loadError}</Text>
        <Button testID="listings-retry" onPress={onRetry}>
          {LISTINGS_COPY.retry}
        </Button>
      </View>
    );
  }

  const detail = (
    <ListingDetail
      event={view.event}
      listing={selectedListing}
      busy={busy}
      createError={createError}
      onContinue={onContinue}
    />
  );

  const map = (
    <ListingsMap
      listings={view.listings}
      selectedListingId={selectedListingId}
      onSelect={setSelectedListingId}
    />
  );

  const cards = (
    <View style={{ gap: theme.space[3] }}>
      {view.listings.map((listing) => (
        <ListingCard
          key={listing.listingId}
          listing={listing}
          selected={listing.listingId === selectedListingId}
          onSelect={setSelectedListingId}
        />
      ))}
    </View>
  );

  const canvas = isDark ? '#0C0C0D' : '#F5F5F5';

  if (layout === 'stacked') {
    return (
      <ScrollView
        testID="selection-screen"
        style={{ flex: 1, backgroundColor: canvas }}
        contentContainerStyle={{ gap: theme.space[4], padding: theme.space[4] }}
      >
        {detail}
        <View style={{ minHeight: 260 }}>{map}</View>
        {cards}
      </ScrollView>
    );
  }

  return (
    <View
      testID="selection-screen"
      style={{
        flex: 1,
        flexDirection: 'row',
        backgroundColor: canvas,
        gap: theme.space[4],
        padding: theme.space[4],
      }}
    >
      <ScrollView
        style={{ width: 360, maxWidth: '38%' }}
        contentContainerStyle={{ gap: theme.space[4] }}
      >
        {detail}
        {cards}
      </ScrollView>
      <View style={{ flex: 1 }}>{map}</View>
    </View>
  );
}
