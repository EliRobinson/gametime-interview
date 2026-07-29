'use client';

import type { CheckoutSession } from '@repo/api-contracts';
import { DEMO_PRICE_CHANGE, msUntilDemoPriceBump } from '@repo/api-contracts';
import type { CheckoutView } from '@repo/ui';
import {
  buildCheckoutShareUrls,
  CHECKOUT_COPY,
  CheckoutCard,
  DemoPriceCountdown,
  isShareableSession,
  mapCheckoutPresentation,
  priceUpdatedNotice,
  viewFromErrorCode,
  viewFromSession,
} from '@repo/ui';
import { trpcErrorCode } from '@repo/utils';
import { useEffect, useMemo, useRef, useState } from 'react';

import { trpc } from '#web/trpc-client';

import { checkoutPageStyles as styles } from './checkout-page-styles';
import { OrderSummary } from './order-summary';

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

function sessionFromView(view: CheckoutView): CheckoutSession | null {
  return 'session' in view && view.session ? view.session : null;
}

function isLeavingCheckout(href: string, currentPathname: string): boolean {
  try {
    const url = new URL(href, window.location.origin);
    if (url.origin !== window.location.origin) return true;
    return url.pathname !== currentPathname;
  } catch {
    return false;
  }
}

function isDecorativeStatus(status: CheckoutSession['status']): boolean {
  return status === 'created' || status === 'active' || status === 'failed';
}

export function CheckoutClient({ initialSession, priceChangedTo }: CheckoutClientProps) {
  const [view, setView] = useState<CheckoutView>(() => initialView(initialSession, priceChangedTo));
  const [busy, setBusy] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const allowUnloadRef = useRef(false);

  const shareSession =
    'session' in view && view.session && isShareableSession(view.session) ? view.session : null;

  const shareUrls = useMemo(() => {
    if (!shareSession) return null;
    return buildCheckoutShareUrls(shareSession.id, webOrigin());
  }, [shareSession]);

  const heldSession = sessionFromView(view);
  const holdSessionId = heldSession && isShareableSession(heldSession) ? heldSession.id : null;

  const summarySession = sessionFromView(view) ?? initialSession;
  const previousUnitPriceCents = view.kind === 'ready' ? view.previousUnitPriceCents : undefined;
  const presentation = mapCheckoutPresentation(summarySession, {
    viewKind: view.kind === 'loading' ? undefined : view.kind,
    previousUnitPriceCents,
  });
  const showDecorative =
    isDecorativeStatus(summarySession.status) && presentation.showDecorativeChrome;
  const showDemoCountdown = view.kind === 'ready' && msUntilDemoPriceBump(view.session) !== null;

  // Demo listing: surface the price-change UI when the hold ages past the demo
  // window so a reviewer can watch reconfirmation without calling setPrice by hand.
  useEffect(() => {
    if (view.kind !== 'ready') return;
    const delayMs = msUntilDemoPriceBump(view.session);
    if (delayMs === null) return;

    const sessionId = view.session.id;
    const timer = window.setTimeout(() => {
      setView((current) => {
        if (current.kind !== 'ready' || current.session.id !== sessionId) return current;
        // Fan already confirmed the demo bump — don't bounce them back.
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

    return () => window.clearTimeout(timer);
  }, [view]);

  useEffect(() => {
    if (!holdSessionId) return;

    const sessionId = holdSessionId;
    const leaveMessage = CHECKOUT_COPY.leaveLockWarning;

    async function releaseHold(): Promise<void> {
      try {
        await trpc.checkout.release.mutate({ sessionId, surface: 'web' });
      } catch {
        // Fan is leaving either way — don't block navigation on release errors.
      }
    }

    async function confirmAndRelease(): Promise<boolean> {
      if (!window.confirm(leaveMessage)) return false;
      await releaseHold();
      return true;
    }

    function onBeforeUnload(event: BeforeUnloadEvent) {
      if (allowUnloadRef.current) return;
      event.preventDefault();
      event.returnValue = leaveMessage;
    }

    function onDocumentClick(event: MouseEvent) {
      if (allowUnloadRef.current) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest('a[href]');
      if (!(anchor instanceof HTMLAnchorElement)) return;
      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:')) return;
      if (!isLeavingCheckout(href, window.location.pathname)) return;

      event.preventDefault();
      event.stopPropagation();

      const destination = new URL(href, window.location.origin).href;
      void (async () => {
        if (!(await confirmAndRelease())) return;
        allowUnloadRef.current = true;
        window.location.assign(destination);
      })();
    }

    // Sentinel so the first Back press stays on checkout long enough to confirm.
    // Skip if already present (React Strict Mode remount).
    if (window.history.state?.checkoutLeaveGuard !== true) {
      window.history.pushState({ checkoutLeaveGuard: true }, '', window.location.href);
    }

    function onPopState() {
      if (allowUnloadRef.current) return;
      void (async () => {
        if (!(await confirmAndRelease())) {
          window.history.pushState({ checkoutLeaveGuard: true }, '', window.location.href);
          return;
        }
        allowUnloadRef.current = true;
        window.history.back();
      })();
    }

    window.addEventListener('beforeunload', onBeforeUnload);
    document.addEventListener('click', onDocumentClick, true);
    window.addEventListener('popstate', onPopState);

    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      document.removeEventListener('click', onDocumentClick, true);
      window.removeEventListener('popstate', onPopState);
    };
  }, [holdSessionId]);

  async function completeOrder(session: CheckoutSession) {
    if (busy) return;
    setBusy(true);
    // Claim UI immediately — never leave Buy enabled while the server holds
    // pending_payment (even for the brief window before the response lands).
    setView({ kind: 'processing', session: { ...session, status: 'pending_payment' } });
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
      setView(
        viewFromSession(
          next,
          priceUpdatedNotice(next.acknowledgedPrice),
          session.acknowledgedPrice,
        ),
      );
    } catch (error) {
      setView(viewFromErrorCode(trpcErrorCode(error), session));
    } finally {
      setBusy(false);
    }
  }

  async function onShare(payload: { webUrl: string; mobileUrl: string }) {
    try {
      await navigator.clipboard.writeText(payload.webUrl);
      setShareFeedback('Link copied — open it in another browser tab to resume on web');
    } catch {
      setShareFeedback(payload.webUrl);
    }
  }

  return (
    <div style={styles.grid} className="checkout-grid">
      <section style={styles.card}>
        <div style={styles.contactRow} data-testid="checkout-contact-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <p style={styles.contactLabel}>{CHECKOUT_COPY.contactLabel}</p>
            {showDemoCountdown ? (
              <DemoPriceCountdown
                listingId={view.session.listingId}
                createdAt={view.session.createdAt}
              />
            ) : null}
          </div>
          <p style={styles.contactEmail}>{CHECKOUT_COPY.contactEmail}</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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

        {showDecorative ? (
          <div style={styles.guarantee} data-testid="guarantee-panel">
            <div style={styles.guaranteeCopy}>
              <p style={styles.guaranteeTitle}>{CHECKOUT_COPY.guaranteeTitle}</p>
              {CHECKOUT_COPY.guaranteeItems.map((item) => (
                <p key={item} style={styles.guaranteeItem}>
                  ✓ {item}
                </p>
              ))}
            </div>
            <div style={styles.guaranteeShield} aria-hidden>
              ✓
            </div>
          </div>
        ) : null}
      </section>

      <OrderSummary session={summarySession} presentation={presentation} />

      <style>{`
        @media (max-width: 800px) {
          .checkout-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
