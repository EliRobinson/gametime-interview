import type { CheckoutSession } from '@repo/api-contracts';
import type { CheckoutView } from '@repo/ui';
import { CheckoutCard, viewFromErrorCode, viewFromSession } from '@repo/ui';
import { formatCurrency } from '@repo/utils';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { SafeAreaView, View } from 'react-native';

import { trpc } from '@/lib/trpc-client';

// Every call from this screen reports where the fan actually is, so the API's
// event log can show the web → mobile handoff rather than a second anonymous
// session.
const SURFACE = 'mobile' as const;

/**
 * A `TRPCClientError` carries its wire code at `error.data.code`. Read it
 * structurally instead of importing the class so this stays a pure function
 * over the response shape.
 */
function trpcErrorCode(error: unknown): string | null {
  if (typeof error !== 'object' || error === null) return null;
  const data = (error as { data?: unknown }).data;
  if (typeof data !== 'object' || data === null) return null;
  const code = (data as { code?: unknown }).code;
  return typeof code === 'string' ? code : null;
}

export default function CheckoutScreen() {
  const params = useLocalSearchParams();
  const rawId = params.id;
  const sessionId = Array.isArray(rawId) ? rawId[0] : rawId;

  const [view, setView] = useState<CheckoutView>({ kind: 'loading' });
  const [busy, setBusy] = useState(false);

  // A resume for one id must never land on top of a later one, and nothing
  // should be written after unmount.
  const requestRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const isCurrent = useCallback(
    (token: number) => mountedRef.current && token === requestRef.current,
    [],
  );

  useEffect(() => {
    if (!sessionId) {
      setView({ kind: 'error', message: 'This link is missing a checkout id.' });
      return;
    }

    const token = (requestRef.current += 1);
    setView({ kind: 'loading' });

    trpc.checkout.resume
      .mutate({ sessionId, surface: SURFACE })
      .then((session) => {
        if (isCurrent(token)) setView(viewFromSession(session));
      })
      .catch((error: unknown) => {
        if (isCurrent(token)) setView(viewFromErrorCode(trpcErrorCode(error)));
      });
  }, [isCurrent, sessionId]);

  const completePurchase = useCallback(
    async (session: CheckoutSession) => {
      if (!sessionId || busy) return;
      const token = requestRef.current;
      setBusy(true);
      try {
        const next = await trpc.checkout.complete.mutate({ sessionId, surface: SURFACE });
        if (isCurrent(token)) setView(viewFromSession(next));
      } catch (error) {
        if (isCurrent(token)) setView(viewFromErrorCode(trpcErrorCode(error), session));
      } finally {
        if (mountedRef.current) setBusy(false);
      }
    },
    [busy, isCurrent, sessionId],
  );

  const confirmNewPrice = useCallback(
    async (session: CheckoutSession) => {
      if (!sessionId || busy) return;
      const token = requestRef.current;
      setBusy(true);
      try {
        const next = await trpc.checkout.confirmPrice.mutate({ sessionId, surface: SURFACE });
        // Acknowledging shows the fan the new number and hands the purchase
        // decision back to them — it deliberately does not charge.
        if (isCurrent(token)) {
          setView(
            viewFromSession(next, `Price updated to ${formatCurrency(next.acknowledgedPrice)}.`),
          );
        }
      } catch (error) {
        if (isCurrent(token)) setView(viewFromErrorCode(trpcErrorCode(error), session));
      } finally {
        if (mountedRef.current) setBusy(false);
      }
    },
    [busy, isCurrent, sessionId],
  );

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <View className="flex-1 justify-center gap-4 px-6">
        <CheckoutCard
          view={view}
          busy={busy}
          onComplete={completePurchase}
          onConfirmPrice={confirmNewPrice}
        />
      </View>
    </SafeAreaView>
  );
}
