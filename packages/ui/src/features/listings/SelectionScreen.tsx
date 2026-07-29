import { useMemo, useState } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { ScrollView, View } from 'react-native';

import { Button } from '../../atoms/Button';
import { Spinner } from '../../atoms/Spinner';
import { Text } from '../../atoms/Text';
import type { ThemeName } from '../../theme';
import { ThemeProvider, useTheme } from '../../theme';
import { ListingCard } from './ListingCard';
import { ListingDetail, SelectionEventHeader } from './ListingDetail';
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

  const eventHeader = <SelectionEventHeader event={view.event} />;

  const selectionDock = (
    <ListingDetail
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

  const inlineContinue = layout === 'stacked' ? { busy, createError, onContinue } : undefined;

  const cards = (
    <View style={{ gap: theme.space[3] }}>
      {view.listings.map((listing) => (
        <ListingCard
          key={listing.listingId}
          listing={listing}
          selected={listing.listingId === selectedListingId}
          onSelect={setSelectedListingId}
          inlineContinue={inlineContinue}
        />
      ))}
    </View>
  );

  const canvas = isDark ? '#0C0C0D' : '#F5F5F5';

  // RN Web may omit the default View stylesheet; set display explicitly so flex layouts work.
  const flexColumn: StyleProp<ViewStyle> = {
    display: 'flex',
    flexDirection: 'column',
  };

  // Mobile: map stays fixed for seat orientation; selected card expands inline
  // with Continue so the list keeps the remaining viewport (no sticky dock).
  if (layout === 'stacked') {
    return (
      <View
        testID="selection-screen"
        style={[
          flexColumn,
          {
            flex: 1,
            backgroundColor: canvas,
            padding: theme.space[4],
            gap: theme.space[3],
            minHeight: 0,
          },
        ]}
      >
        {eventHeader}
        <View style={{ height: 220, flexShrink: 0, display: 'flex' }}>{map}</View>
        <ScrollView
          style={{ flex: 1, minHeight: 0 }}
          contentContainerStyle={{ gap: theme.space[3], paddingBottom: theme.space[4] }}
        >
          {cards}
        </ScrollView>
      </View>
    );
  }

  // Viewport-locked split: left scrolls independently; map fills remaining
  // height and never grows with listing/detail content.
  return (
    <View
      testID="selection-screen"
      style={{
        display: 'flex',
        flex: 1,
        flexDirection: 'row',
        alignItems: 'stretch',
        backgroundColor: canvas,
        gap: theme.space[4],
        padding: theme.space[4],
        minHeight: 0,
        overflow: 'hidden',
      }}
    >
      <View
        style={[
          flexColumn,
          {
            width: 360,
            maxWidth: '38%',
            flexShrink: 0,
            gap: theme.space[3],
            minHeight: 0,
            alignSelf: 'stretch',
            overflow: 'hidden',
          },
        ]}
      >
        {eventHeader}
        <ScrollView
          style={{ flex: 1, minHeight: 0 }}
          contentContainerStyle={{ gap: theme.space[3] }}
        >
          {cards}
        </ScrollView>
        {selectionDock}
      </View>
      <View
        style={{
          display: 'flex',
          flex: 1,
          minHeight: 0,
          minWidth: 0,
          alignSelf: 'stretch',
        }}
      >
        {map}
      </View>
    </View>
  );
}
