import type { CheckoutSession } from '@repo/api-contracts';
import { DEMO_PRICE_CHANGE, msUntilDemoPriceBump } from '@repo/api-contracts';
import { colors, spacePx } from '@repo/tokens';
import type { CheckoutView } from '@repo/ui';
import {
  buildCheckoutShareUrls,
  buildNativeSharePayload,
  CheckoutCard,
  CheckoutStadiumMap,
  CheckoutTerms,
  DemoPriceCountdown,
  EventSummary,
  isShareableSession,
  mapCheckoutPresentation,
  PriceBreakdown,
  priceUpdatedNotice,
  ShareTickets,
  SuperDealBanner,
  ThemeProvider,
  TicketDeliveryRow,
  UrgencyBanner,
  viewFromErrorCode,
  viewFromSession,
} from '@repo/ui';
import { trpcErrorCode } from '@repo/utils';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, Share, Text as RNText, View } from 'react-native';

import { trpc as listingsApi } from '@/lib/trpc';
import { trpc } from '@/lib/trpc-client';

// Every call from this screen reports where the fan actually is, so the API's
// event log can show the web → mobile handoff rather than a second anonymous
// session.
const SURFACE = 'mobile' as const;

// Normally we'd store this in a `env.local` file. For the demo, we hardcode it here.
const WEB_ORIGIN = process.env.EXPO_PUBLIC_WEB_ORIGIN ?? 'http://localhost:3001';

function sessionFromView(view: CheckoutView): CheckoutSession | null {
  return 'session' in view && view.session ? view.session : null;
}

export default function CheckoutScreen() {
  const router = useRouter();
  const listingsUtils = listingsApi.useUtils();
  const params = useLocalSearchParams();
  const rawId = params.id;
  const sessionId = Array.isArray(rawId) ? rawId[0] : rawId;

  const [view, setView] = useState<CheckoutView>({ kind: 'loading' });
  const [busy, setBusy] = useState(false);
  const [detailsExpanded, setDetailsExpanded] = useState(false);

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

  // Demo listing: after the demo window on an active hold, show price-change recovery.
  useEffect(() => {
    if (view.kind !== 'ready') return;
    const delayMs = msUntilDemoPriceBump(view.session);
    if (delayMs === null) return;

    const trackedSessionId = view.session.id;
    const timer = setTimeout(() => {
      setView((current) => {
        if (current.kind !== 'ready' || current.session.id !== trackedSessionId) return current;
        if (current.session.acknowledgedPrice === DEMO_PRICE_CHANGE.heldPriceAfterBumpCents) {
          return current;
        }
        return {
          kind: 'price_changed',
          session: current.session,
          newPriceCents: DEMO_PRICE_CHANGE.heldPriceAfterBumpCents,
        };
      });
    }, delayMs);

    return () => clearTimeout(timer);
  }, [view]);

  const shareSession = (() => {
    const session = sessionFromView(view);
    return session && isShareableSession(session) ? session : null;
  })();

  const shareUrls = useMemo(() => {
    if (!shareSession) return null;
    return buildCheckoutShareUrls(shareSession.id, WEB_ORIGIN);
  }, [shareSession]);

  const completePurchase = useCallback(
    async (session: CheckoutSession) => {
      if (!sessionId || busy) return;
      const token = requestRef.current;
      setBusy(true);
      // Claim UI immediately — never leave Buy enabled while pending_payment.
      setView({ kind: 'processing', session: { ...session, status: 'pending_payment' } });
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
        // decision back to them — it deliberately does not charge. Expand the
        // breakdown so the strike-through previous price is visible without a tap.
        if (isCurrent(token)) {
          setDetailsExpanded(true);
          setView(
            viewFromSession(
              next,
              priceUpdatedNotice(next.acknowledgedPrice),
              session.acknowledgedPrice,
            ),
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

  const onShare = useCallback(async (payload: { webUrl: string; mobileUrl: string }) => {
    // Message-only: iOS Copy pastes the URL; message+url showed "2 Links";
    // url-only left the clipboard empty on Copy.
    await Share.share(buildNativeSharePayload(payload.webUrl));
  }, []);

  const onBack = useCallback(async () => {
    // Best-effort: free the listing even if the network call fails, then leave.
    if (sessionId) {
      try {
        await trpc.checkout.release.mutate({ sessionId, surface: SURFACE });
      } catch {
        // Fan is leaving either way — don't block navigation on release errors.
      }
    }
    // Don't wait for the 10s poll — the listing we unlocked should show fresh now.
    void listingsUtils.listings.list.invalidate();
    router.back();
  }, [listingsUtils.listings.list, router, sessionId]);

  const session = sessionFromView(view);
  const previousUnitPriceCents = view.kind === 'ready' ? view.previousUnitPriceCents : undefined;
  const presentation = session
    ? mapCheckoutPresentation(session, { viewKind: view.kind, previousUnitPriceCents })
    : null;
  const showShell = view.kind !== 'loading' && presentation !== null;
  const showStickyActions =
    view.kind === 'ready' || view.kind === 'price_changed' || view.kind === 'failed';
  const showDemoCountdown = view.kind === 'ready' && msUntilDemoPriceBump(view.session) !== null;

  return (
    <ThemeProvider theme="light">
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvasLight }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: spacePx[4],
            paddingVertical: spacePx[3],
            backgroundColor: colors.surface,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => {
              void onBack();
            }}
            hitSlop={8}
            testID="checkout-back"
          >
            <RNText style={{ fontSize: 22, color: colors.text }}>‹</RNText>
          </Pressable>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacePx[2] }}>
            <RNText style={{ fontSize: 17, fontWeight: '600', color: colors.text }}>
              Checkout
            </RNText>
            {showDemoCountdown ? (
              <DemoPriceCountdown
                listingId={view.session.listingId}
                createdAt={view.session.createdAt}
              />
            ) : null}
            <View
              accessibilityLabel="Secure checkout"
              style={{
                width: 18,
                height: 18,
                borderRadius: 999,
                backgroundColor: colors.accent,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <RNText style={{ fontSize: 11, fontWeight: '800', color: colors.canvas }}>✓</RNText>
            </View>
          </View>
          <View style={{ width: 22 }} />
        </View>

        {view.kind === 'loading' || !showShell ? (
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              paddingHorizontal: spacePx[6],
            }}
          >
            <CheckoutCard
              theme="light"
              view={view}
              busy={busy}
              onComplete={completePurchase}
              onConfirmPrice={confirmNewPrice}
            />
          </View>
        ) : (
          <>
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{
                paddingHorizontal: spacePx[4],
                paddingTop: spacePx[4],
                paddingBottom: spacePx[8],
                gap: spacePx[4],
              }}
            >
              <CheckoutStadiumMap bubble={presentation.mapBubble} />
              <EventSummary presentation={presentation} variant="mobile" />

              <PriceBreakdown
                presentation={presentation}
                expanded={detailsExpanded}
                onToggleDetails={() => setDetailsExpanded((open) => !open)}
                showPromo={presentation.showDecorativeChrome}
              />

              <TicketDeliveryRow />

              {presentation.isSuperDeal ? <SuperDealBanner /> : null}

              {showStickyActions && shareUrls ? (
                <ShareTickets
                  webUrl={shareUrls.shareWebUrl}
                  mobileUrl={shareUrls.shareMobileUrl}
                  onShare={onShare}
                />
              ) : null}

              {!showStickyActions ? (
                <CheckoutCard
                  theme="light"
                  view={view}
                  busy={busy}
                  onComplete={completePurchase}
                  onConfirmPrice={confirmNewPrice}
                  shareWebUrl={shareUrls?.shareWebUrl}
                  shareMobileUrl={shareUrls?.shareMobileUrl}
                  onShare={onShare}
                />
              ) : null}
            </ScrollView>

            {showStickyActions ? (
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderTopWidth: 1,
                  borderTopColor: colors.border,
                  paddingBottom: spacePx[4],
                }}
              >
                {presentation.urgencyLabel ? (
                  <UrgencyBanner label={presentation.urgencyLabel} variant="footer" />
                ) : null}
                <View
                  style={{ paddingHorizontal: spacePx[4], paddingTop: spacePx[3], gap: spacePx[2] }}
                >
                  <CheckoutTerms />
                  <CheckoutCard
                    theme="light"
                    view={view}
                    busy={busy}
                    onComplete={completePurchase}
                    onConfirmPrice={confirmNewPrice}
                    showShare={false}
                  />
                </View>
              </View>
            ) : null}
          </>
        )}
      </SafeAreaView>
    </ThemeProvider>
  );
}
