'use client';

import type { ListingAvailability } from '@repo/api-contracts';
import type { ListingRowView, SelectionViewModel } from '@repo/ui';
import { LISTINGS_COPY, mapListingsView, SelectionScreen } from '@repo/ui';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { trpc } from '#web/trpc-client';

async function fetchListings(): Promise<ListingAvailability[]> {
  const result = await trpc.listings.list.query();
  return result.listings;
}

const LISTINGS_POLL_MS = 10_000;

export function SelectionLanding() {
  const router = useRouter();
  const [view, setView] = useState<SelectionViewModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const load = useCallback(async ({ showLoading }: { showLoading: boolean }) => {
    if (showLoading) {
      setLoading(true);
      setLoadError(false);
    }
    try {
      const listings = await fetchListings();
      setView(mapListingsView(listings));
      setLoadError(false);
    } catch {
      if (showLoading) {
        setView(null);
        setLoadError(true);
      }
      // Background polls keep the last good list on transient failures.
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load({ showLoading: true });
  }, [load]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      void load({ showLoading: false });
    }, LISTINGS_POLL_MS);
    return () => clearInterval(intervalId);
  }, [load]);

  const onContinue = useCallback(
    async (listing: ListingRowView) => {
      if (busy) return;
      setBusy(true);
      setCreateError(null);
      try {
        const session = await trpc.checkout.create.mutate({ listingId: listing.listingId });
        router.push(`/checkout/${session.id}`);
      } catch {
        setCreateError(LISTINGS_COPY.createError);
        // Refresh availability — the listing may now be held by someone else.
        await load({ showLoading: false });
      } finally {
        setBusy(false);
      }
    },
    [busy, load, router],
  );

  return (
    <main
      style={{
        height: 'calc(100vh - 56px)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <SelectionScreen
        view={view}
        loading={loading}
        loadError={loadError}
        busy={busy}
        createError={createError}
        onRetry={() => void load({ showLoading: true })}
        onContinue={onContinue}
        theme="light"
        layout="sidebar"
      />
    </main>
  );
}
