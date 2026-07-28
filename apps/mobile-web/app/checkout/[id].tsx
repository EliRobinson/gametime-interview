import type { CheckoutSession } from '@repo/api-contracts';
import { colors, spacePx } from '@repo/tokens';
import type { CheckoutView } from '@repo/ui';
import {
  buildCheckoutShareUrls,
  CheckoutCard,
  isShareableSession,
  priceUpdatedNotice,
  viewFromErrorCode,
  viewFromSession,
} from '@repo/ui';
import { trpcErrorCode } from '@repo/utils';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SafeAreaView, Share, View } from 'react-native';

import { trpc } from '@/lib/trpc-client';

// Every call from this screen reports where the fan actually is, so the API's
// event log can show the web → mobile handoff rather than a second anonymous
// session.
const SURFACE = 'mobile' as const;

const WEB_ORIGIN = process.env.EXPO_PUBLIC_WEB_ORIGIN ?? 'http://localhost:3001';

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

  const shareSession =
    'session' in view && view.session && isShareableSession(view.session) ? view.session : null;

  const shareUrls = useMemo(() => {
    if (!shareSession) return null;
    return buildCheckoutShareUrls(shareSession.id, WEB_ORIGIN);
  }, [shareSession]);

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
          setView(viewFromSession(next, priceUpdatedNotice(next.acknowledgedPrice)));
        }
      } catch (error) {
        if (isCurrent(token)) setView(viewFromErrorCode(trpcErrorCode(error), session));
      } finally {
        if (mountedRef.current) setBusy(false);
      }
    },
    [busy, isCurrent, sessionId],
  );

  const onShare = useCallback(async (payload: { webUrl: string; mobileUrl: string }) => {
    await Share.share({
      message: `Resume checkout:\n${payload.webUrl}\nApp: ${payload.mobileUrl}`,
      url: payload.webUrl,
    });
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }}>
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          gap: spacePx[4],
          paddingHorizontal: spacePx[6],
        }}
      >
        <CheckoutCard
          theme="dark"
          view={view}
          busy={busy}
          onComplete={completePurchase}
          onConfirmPrice={confirmNewPrice}
          shareWebUrl={shareUrls?.shareWebUrl}
          shareMobileUrl={shareUrls?.shareMobileUrl}
          onShare={onShare}
        />
      </View>
    </SafeAreaView>
  );
}
