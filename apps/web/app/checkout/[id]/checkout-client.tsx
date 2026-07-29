'use client';

import type { CheckoutSession } from '@repo/api-contracts';
import type { CheckoutView } from '@repo/ui';
import {
  buildCheckoutShareUrls,
  CHECKOUT_COPY,
  CheckoutCard,
  isShareableSession,
  priceUpdatedNotice,
  viewFromErrorCode,
  viewFromSession,
} from '@repo/ui';
import { trpcErrorCode } from '@repo/utils';
import { useMemo, useState } from 'react';

import { trpc } from '#web/trpc-client';

export type CheckoutClientProps = {
  /**
   * The session as resolved on the server. The client starts from this value
   * and never refetches on mount — that is what keeps the first paint free of
   * a loading flash.
   */
  initialSession: CheckoutSession;
  /** Live price, in cents, when the server already knows it diverged. */
  priceChangedTo?: number;
};

function initialView(session: CheckoutSession, priceChangedTo?: number): CheckoutView {
  const base = viewFromSession(session);
  if (base.kind !== 'ready') return base;
  if (priceChangedTo !== undefined) {
    return { kind: 'price_changed', session, newPriceCents: priceChangedTo };
  }
  return base;
}

function webOrigin(): string {
  // Prefer an explicit public origin so share links stay stable in local
  // multi-port setups (API :4000, web :3001) and in tests under jsdom.
  return process.env.NEXT_PUBLIC_WEB_ORIGIN ?? 'http://localhost:3001';
}

function showsTerms(view: CheckoutView): boolean {
  return view.kind === 'ready' || view.kind === 'price_changed' || view.kind === 'failed';
}

export function CheckoutClient({ initialSession, priceChangedTo }: CheckoutClientProps) {
  const [view, setView] = useState<CheckoutView>(() => initialView(initialSession, priceChangedTo));
  const [busy, setBusy] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  const shareSession =
    'session' in view && view.session && isShareableSession(view.session) ? view.session : null;

  const shareUrls = useMemo(() => {
    if (!shareSession) return null;
    return buildCheckoutShareUrls(shareSession.id, webOrigin());
  }, [shareSession]);

  async function completeOrder(session: CheckoutSession) {
    if (busy) return;
    setBusy(true);
    try {
      const next = await trpc.checkout.complete.mutate({ sessionId: session.id, surface: 'web' });
      setView(viewFromSession(next));
    } catch (error) {
      setView(viewFromErrorCode(trpcErrorCode(error), session));
    } finally {
      setBusy(false);
    }
  }

  async function confirmNewPrice(session: CheckoutSession) {
    if (busy) return;
    setBusy(true);
    try {
      const next = await trpc.checkout.confirmPrice.mutate({
        sessionId: session.id,
        surface: 'web',
      });
      setView(viewFromSession(next, priceUpdatedNotice(next.acknowledgedPrice)));
    } catch (error) {
      setView(viewFromErrorCode(trpcErrorCode(error), session));
    } finally {
      setBusy(false);
    }
  }

  async function onShare(payload: { webUrl: string; mobileUrl: string }) {
    const body = `${payload.webUrl}\nApp: ${payload.mobileUrl}`;
    try {
      await navigator.clipboard.writeText(body);
      setShareFeedback('Link copied');
    } catch {
      setShareFeedback(payload.webUrl);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {showsTerms(view) ? (
        <p
          data-testid="checkout-terms"
          style={{ margin: 0, color: 'var(--color-muted)', fontSize: 14 }}
        >
          {CHECKOUT_COPY.termsPrefix}
          <span style={{ textDecoration: 'underline' }}>{CHECKOUT_COPY.termsOfUse}</span>
          {CHECKOUT_COPY.termsAnd}
          <span style={{ textDecoration: 'underline' }}>{CHECKOUT_COPY.privacyPolicy}</span>
        </p>
      ) : null}

      <CheckoutCard
        view={view}
        busy={busy}
        onComplete={completeOrder}
        onConfirmPrice={confirmNewPrice}
        shareWebUrl={shareUrls?.shareWebUrl}
        shareMobileUrl={shareUrls?.shareMobileUrl}
        onShare={onShare}
      />
      {shareFeedback ? (
        <p data-testid="share-feedback" style={{ marginTop: 0, fontSize: 14 }}>
          {shareFeedback}
        </p>
      ) : null}
    </div>
  );
}
