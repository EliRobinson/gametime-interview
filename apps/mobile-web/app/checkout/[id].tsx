import type { CheckoutSession } from '@repo/api-contracts';
import { Button } from '@repo/ui';
import { useLocalSearchParams } from 'expo-router';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, SafeAreaView, Text, View } from 'react-native';

import { trpc } from '@/lib/trpc-client';

// Every call from this screen reports where the fan actually is, so the API's
// event log can show the web → mobile handoff rather than a second anonymous
// session.
const SURFACE = 'mobile' as const;

/**
 * What the fan is looking at. Session expiry and inventory availability are two
 * distinct outcomes owned by two different services, so they get two distinct
 * view states (and two distinct messages) rather than one "something's wrong".
 */
type CheckoutView =
  | { kind: 'loading' }
  | { kind: 'session'; session: CheckoutSession; notice: string | null }
  | { kind: 'price_changed'; session: CheckoutSession }
  | { kind: 'expired' }
  | { kind: 'unavailable' }
  | { kind: 'claimed_elsewhere' }
  | { kind: 'not_found' }
  | { kind: 'error'; message: string };

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

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

function viewFromSession(session: CheckoutSession, notice: string | null = null): CheckoutView {
  // An expired session carries *which* clock ran out: the session's own, or the
  // inventory hold underneath it. They mean different things to the fan, so a
  // released hold reads as unavailability even when resume reports it as expiry.
  if (session.status === 'expired') {
    return session.expiryReason === 'hold_released' ? { kind: 'unavailable' } : { kind: 'expired' };
  }
  return { kind: 'session', session, notice };
}

function viewFromError(error: unknown, session?: CheckoutSession): CheckoutView {
  switch (trpcErrorCode(error)) {
    case 'NOT_FOUND':
      return { kind: 'not_found' };
    case 'TIMEOUT':
      return { kind: 'expired' };
    case 'UNPROCESSABLE_CONTENT':
      return { kind: 'unavailable' };
    case 'PRECONDITION_FAILED':
      // The fan must acknowledge the new price themselves — never reprice and
      // charge on their behalf.
      return session
        ? { kind: 'price_changed', session }
        : { kind: 'error', message: 'The price for this listing changed. Reopen your checkout.' };
    case 'CONFLICT':
      return { kind: 'claimed_elsewhere' };
    default:
      return { kind: 'error', message: 'Something went wrong on our end. Please try again.' };
  }
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
        if (isCurrent(token)) setView(viewFromError(error));
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
        if (isCurrent(token)) setView(viewFromError(error, session));
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
            viewFromSession(next, `Price updated to ${formatPrice(next.acknowledgedPrice)}.`),
          );
        }
      } catch (error) {
        if (isCurrent(token)) setView(viewFromError(error, session));
      } finally {
        if (mountedRef.current) setBusy(false);
      }
    },
    [busy, isCurrent, sessionId],
  );

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <View className="flex-1 justify-center gap-4 px-6">
        {renderView({ view, busy, completePurchase, confirmNewPrice })}
      </View>
    </SafeAreaView>
  );
}

function renderView({
  view,
  busy,
  completePurchase,
  confirmNewPrice,
}: {
  view: CheckoutView;
  busy: boolean;
  completePurchase: (session: CheckoutSession) => void;
  confirmNewPrice: (session: CheckoutSession) => void;
}) {
  switch (view.kind) {
    case 'loading':
      return (
        <View className="items-center gap-3">
          <ActivityIndicator />
          <Text className="text-muted">Loading your checkout…</Text>
        </View>
      );

    case 'session':
      return renderSession(view.session, view.notice, busy, completePurchase);

    case 'price_changed':
      return (
        <Panel
          title="Price changed"
          body={`The seller's price for this listing moved while your checkout was open. You last agreed to ${formatPrice(
            view.session.acknowledgedPrice,
          )}. Nothing has been charged.`}
        >
          <Button
            onPress={() => confirmNewPrice(view.session)}
            testID="confirm-price-button"
            variant="primary"
          >
            {busy ? 'Checking price…' : 'Confirm at new price'}
          </Button>
        </Panel>
      );

    case 'expired':
      return (
        <Panel
          title="Checkout session expired"
          body="Your hold on these tickets lapsed, so this checkout is no longer available. Nothing was charged — start a new checkout to try again."
        />
      );

    case 'unavailable':
      return (
        <Panel
          title="Listing no longer available"
          body="These tickets were claimed before your purchase went through. Nothing was charged — browse similar seats instead."
        />
      );

    case 'claimed_elsewhere':
      return (
        <Panel
          title="Finishing on another device"
          body="This order is already being completed on another device. Nothing is wrong — check that device, or come back in a moment to see the confirmation."
        />
      );

    case 'not_found':
      return (
        <Panel
          title="Checkout not found"
          body="We couldn’t find this checkout. The link may be out of date — start a new checkout from the listing."
        />
      );

    case 'error':
      return <Panel title="Checkout unavailable" body={view.message} />;
  }
}

function renderSession(
  session: CheckoutSession,
  notice: string | null,
  busy: boolean,
  completePurchase: (session: CheckoutSession) => void,
) {
  if (session.status === 'completed') {
    return (
      <Panel
        title="Order complete"
        body={`You're all set — ${formatPrice(
          session.acknowledgedPrice,
        )} charged. Your tickets are on their way to your account.`}
      />
    );
  }

  if (session.status === 'failed') {
    return (
      <Panel
        title="Payment didn’t go through"
        body="Your seats are still held. You can try the payment again."
      >
        <Text className="text-muted" testID="failure-reason">
          Reason: {session.failureReason ?? 'unknown'}
        </Text>
        <Button onPress={() => completePurchase(session)} testID="retry-button" variant="primary">
          {busy ? 'Retrying…' : 'Try again'}
        </Button>
      </Panel>
    );
  }

  return (
    <View className="gap-4">
      {/* The originating surface isn't on the session, and this screen is
          reached by deep link as often as by in-app navigation, so don't claim
          where the fan came from. */}
      <Text className="text-sm uppercase tracking-wide text-muted">Resumed checkout</Text>
      <Text className="text-2xl font-bold text-gray-900">Finish your checkout</Text>
      <View className="gap-1">
        <Text className="text-muted">Total</Text>
        <Text className="text-4xl font-bold text-gray-900" testID="acknowledged-price">
          {formatPrice(session.acknowledgedPrice)}
        </Text>
      </View>
      {notice ? (
        <Text className="text-muted" testID="price-notice">
          {notice}
        </Text>
      ) : null}
      <Button onPress={() => completePurchase(session)} testID="complete-button" variant="primary">
        {busy ? 'Completing…' : 'Complete purchase'}
      </Button>
    </View>
  );
}

function Panel({ title, body, children }: { title: string; body: string; children?: ReactNode }) {
  return (
    <View className="gap-3">
      <Text className="text-2xl font-bold text-gray-900">{title}</Text>
      <Text className="text-muted">{body}</Text>
      {children}
    </View>
  );
}
