'use client';

import type { CheckoutSession } from '@repo/api-contracts';
import { msUntilDemoPriceBump } from '@repo/api-contracts';
import type { CheckoutView } from '@repo/ui';
import {
  buildCheckoutShareUrls,
  CHECKOUT_COPY,
  CheckoutCard,
  CheckoutTerms,
  ContactRow,
  DemoPriceCountdown,
  GuaranteePanel,
  isDecorativeSessionStatus,
  isShareableSession,
  mapCheckoutPresentation,
  sessionFromView,
  showsCheckoutActions,
  useCheckoutActions,
  viewFromResume,
} from '@repo/ui';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { trpc } from '#web/trpc-client';

import { useCheckoutLeaveMode } from '../../checkout-leave-mode';
import { checkoutPageStyles as styles } from './checkout-page-styles';
import { OrderSummary } from './order-summary';

export type CheckoutClientProps = {
  /**
   * The session as resolved on the server. The client starts from this value
   * and never refetches on mount — that is what keeps the first paint free of
   * a loading flash.
   */
  initialSession: CheckoutSession;
  /** Live hold price from SSR resume; drives price_changed when it diverges. */
  livePriceCents?: number | null;
};

function webOrigin(): string {
  // Prefer an explicit public origin so share links stay stable in local
  // multi-port setups (API :4000, web :3001) and in tests under jsdom.
  return process.env.NEXT_PUBLIC_WEB_ORIGIN ?? 'http://localhost:3001';
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

const SURFACE = 'web' as const;

export function CheckoutClient({ initialSession, livePriceCents = null }: CheckoutClientProps) {
  const [view, setView] = useState<CheckoutView>(() =>
    viewFromResume(initialSession, livePriceCents),
  );
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const allowUnloadRef = useRef(false);
  const { setLeaveMode } = useCheckoutLeaveMode();

  // Header leave control: "Cancel" while shopping, "Done" only after purchase.
  useEffect(() => {
    setLeaveMode(view.kind === 'completed' ? 'done' : 'cancel');
    return () => setLeaveMode('cancel');
  }, [setLeaveMode, view.kind]);

  const mutations = useMemo(
    () => ({
      complete: trpc.checkout.complete.mutate,
      confirmPrice: trpc.checkout.confirmPrice.mutate,
      resume: trpc.checkout.resume.mutate,
    }),
    [],
  );

  const { busy, completeOrder, confirmNewPrice, refreshFromResume } = useCheckoutActions({
    surface: SURFACE,
    mutations,
    setView,
  });

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
    isDecorativeSessionStatus(summarySession.status) && presentation.showDecorativeChrome;
  const showDemoCountdown = view.kind === 'ready' && msUntilDemoPriceBump(view.session) !== null;

  const onDemoPriceExpire = useCallback(() => {
    if (view.kind !== 'ready') return;
    void refreshFromResume(view.session.id);
  }, [refreshFromResume, view]);

  useEffect(() => {
    if (!holdSessionId) return;

    const sessionId = holdSessionId;
    const leaveMessage = CHECKOUT_COPY.leaveLockWarning;

    async function releaseHold(): Promise<void> {
      try {
        await trpc.checkout.release.mutate({ sessionId, surface: SURFACE });
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <ContactRow />
          </div>
          {showDemoCountdown ? (
            <DemoPriceCountdown
              listingId={view.session.listingId}
              createdAt={view.session.createdAt}
              onExpire={onDemoPriceExpire}
            />
          ) : null}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {showsCheckoutActions(view) ? <CheckoutTerms /> : null}

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

        {showDecorative ? <GuaranteePanel /> : null}
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
