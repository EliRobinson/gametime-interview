'use client';

import type { CheckoutSession } from '@repo/api-contracts';
import type { CheckoutView } from '@repo/ui';
import { CheckoutCard, viewFromErrorCode, viewFromSession } from '@repo/ui';
import { formatCurrency } from '@repo/utils';
import { useState } from 'react';

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

/** tRPC client errors carry the wire code on `.data.code`. */
function trpcErrorCode(error: unknown): string | null {
  if (typeof error !== 'object' || error === null) return null;
  const data = (error as { data?: unknown }).data;
  if (typeof data !== 'object' || data === null) return null;
  const code = (data as { code?: unknown }).code;
  return typeof code === 'string' ? code : null;
}

function initialView(session: CheckoutSession, priceChangedTo?: number): CheckoutView {
  const base = viewFromSession(session);
  if (base.kind !== 'session') return base;
  if (priceChangedTo !== undefined) {
    return { kind: 'price_changed', session, newPriceCents: priceChangedTo };
  }
  return base;
}

export function CheckoutClient({ initialSession, priceChangedTo }: CheckoutClientProps) {
  const [view, setView] = useState<CheckoutView>(() => initialView(initialSession, priceChangedTo));
  const [busy, setBusy] = useState(false);

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
      setView(viewFromSession(next, `Price updated to ${formatCurrency(next.acknowledgedPrice)}.`));
    } catch (error) {
      setView(viewFromErrorCode(trpcErrorCode(error), session));
    } finally {
      setBusy(false);
    }
  }

  return (
    <CheckoutCard
      view={view}
      busy={busy}
      onComplete={completeOrder}
      onConfirmPrice={confirmNewPrice}
    />
  );
}
