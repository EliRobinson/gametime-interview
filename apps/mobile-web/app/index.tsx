import type { ListingRowView, SelectionViewModel } from '@repo/ui';
import { LISTINGS_COPY, mapListingsView, SelectionScreen } from '@repo/ui';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native';

import { trpc } from '@/lib/trpc';
import { trpc as vanillaTrpc } from '@/lib/trpc-client';

export default function HomeScreen() {
  const router = useRouter();
  const listingsQuery = trpc.listings.list.useQuery(undefined, { retry: false });
  const [busy, setBusy] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const view: SelectionViewModel | null = listingsQuery.data
    ? mapListingsView(listingsQuery.data.listings)
    : null;

  useEffect(() => {
    if (listingsQuery.isSuccess) setCreateError(null);
  }, [listingsQuery.isSuccess]);

  const onContinue = useCallback(
    async (listing: ListingRowView) => {
      if (busy) return;
      setBusy(true);
      setCreateError(null);
      try {
        const session = await vanillaTrpc.checkout.create.mutate({ listingId: listing.listingId });
        router.push(`/checkout/${session.id}`);
      } catch {
        setCreateError(LISTINGS_COPY.createError);
        void listingsQuery.refetch();
      } finally {
        setBusy(false);
      }
    },
    [busy, listingsQuery, router],
  );

  return (
    <SafeAreaView style={{ flex: 1 }} testID="home-selection">
      <SelectionScreen
        view={view}
        loading={listingsQuery.isLoading}
        loadError={listingsQuery.isError}
        busy={busy}
        createError={createError}
        onRetry={() => void listingsQuery.refetch()}
        onContinue={onContinue}
        theme="dark"
        layout="stacked"
      />
    </SafeAreaView>
  );
}
