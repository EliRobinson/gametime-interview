'use client';

import type { CheckoutSession } from '@repo/api-contracts';
import { useState } from 'react';

import { formatCents } from '#web/format';
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

const styles = {
  card: {
    border: '1px solid #d8d8dd',
    borderRadius: 8,
    padding: '1rem 1.25rem',
    marginTop: '1rem',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: '1rem',
  },
  total: { fontSize: '1.5rem' },
  banner: {
    border: '1px solid #b8860b',
    background: '#fdf6e3',
    borderRadius: 8,
    padding: '0.75rem 1rem',
    margin: '1rem 0',
  },
  notice: {
    border: '1px solid #8a8a90',
    borderRadius: 8,
    padding: '0.75rem 1rem',
    margin: '1rem 0',
  },
  button: {
    marginTop: '1rem',
    padding: '0.6rem 1.1rem',
    fontSize: '1rem',
    borderRadius: 6,
    cursor: 'pointer',
  },
} as const;

/** tRPC client errors carry the wire code on `.data.code`. */
function errorCode(error: unknown): string {
  if (typeof error !== 'object' || error === null || !('data' in error)) return 'UNKNOWN';
  const data = (error as { data?: unknown }).data;
  if (typeof data !== 'object' || data === null || !('code' in data)) return 'UNKNOWN';
  const code = (data as { code?: unknown }).code;
  return typeof code === 'string' ? code : 'UNKNOWN';
}

type EndedState = 'session_lapsed' | 'hold_released' | 'not_found';

const ENDED_COPY: Record<EndedState, { headline: string; detail: string }> = {
  session_lapsed: {
    headline: 'Checkout session expired',
    detail:
      'This checkout sat idle too long and expired. Nothing was charged — start a new checkout to try again.',
  },
  hold_released: {
    headline: 'Listing no longer available',
    detail: 'The hold on these tickets was released. Nothing was charged.',
  },
  not_found: {
    headline: "We couldn't find that checkout",
    detail: 'This checkout link is no longer valid. Start again from the listing.',
  },
};

/** An already-expired session arrives from the server carrying its own reason. */
function endedFromSession(session: CheckoutSession): EndedState | null {
  if (session.status !== 'expired') return null;
  return session.expiryReason === 'hold_released' ? 'hold_released' : 'session_lapsed';
}

export function CheckoutClient({ initialSession, priceChangedTo }: CheckoutClientProps) {
  const [session, setSession] = useState(initialSession);
  const [priceChanged, setPriceChanged] = useState(priceChangedTo !== undefined);
  const [newPrice, setNewPrice] = useState<number | null>(priceChangedTo ?? null);
  // Which terminal state ended this checkout, if any. A lapsed session clock and
  // a released inventory hold are different situations with different next
  // steps, so they are tracked apart rather than as one "unavailable" flag.
  const [ended, setEnded] = useState<EndedState | null>(endedFromSession(initialSession));
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function applyError(error: unknown) {
    switch (errorCode(error)) {
      case 'PRECONDITION_FAILED':
        // The fan agreed to a price that no longer holds. Never re-price them
        // silently: block completion until they acknowledge the new total.
        setPriceChanged(true);
        setNotice(null);
        return;
      case 'CONFLICT':
        setNotice('This order is already being completed on another device.');
        return;
      case 'TIMEOUT':
        setEnded('session_lapsed');
        return;
      case 'UNPROCESSABLE_CONTENT':
        setEnded('hold_released');
        return;
      case 'NOT_FOUND':
        setEnded('not_found');
        return;
      default:
        setNotice('Something went wrong. Nothing was charged — please try again.');
    }
  }

  async function completeOrder() {
    setBusy(true);
    setNotice(null);
    try {
      setSession(await trpc.checkout.complete.mutate({ sessionId: session.id, surface: 'web' }));
    } catch (error) {
      applyError(error);
    } finally {
      setBusy(false);
    }
  }

  async function confirmNewPrice() {
    setBusy(true);
    setNotice(null);
    try {
      const updated = await trpc.checkout.confirmPrice.mutate({
        sessionId: session.id,
        surface: 'web',
      });
      setSession(updated);
      setPriceChanged(false);
      setNewPrice(null);
      setNotice('Price updated. Review the new total, then complete your order.');
    } catch (error) {
      applyError(error);
    } finally {
      setBusy(false);
    }
  }

  if (ended) {
    return (
      <section style={styles.card}>
        <h2>{ENDED_COPY[ended].headline}</h2>
        <p>{ENDED_COPY[ended].detail}</p>
      </section>
    );
  }

  if (session.status === 'completed') {
    return (
      <section style={styles.card}>
        <h2>You&apos;re all set</h2>
        <p>
          Order confirmed for {session.listingId} at {formatCents(session.acknowledgedPrice)}.
        </p>
      </section>
    );
  }

  if (session.status === 'failed') {
    return (
      <section style={styles.card}>
        <h2>Payment didn&apos;t go through</h2>
        <p>Reason: {session.failureReason ?? 'unknown'}</p>
        <p>Nothing was charged. Your seats are still held.</p>
        <button type="button" style={styles.button} onClick={completeOrder} disabled={busy}>
          Try again
        </button>
      </section>
    );
  }

  return (
    <section style={styles.card}>
      <div style={styles.totalRow}>
        <span>Total</span>
        <strong style={styles.total}>{formatCents(session.acknowledgedPrice)}</strong>
      </div>

      {priceChanged ? (
        <div role="alert" style={styles.banner}>
          <p>
            {newPrice === null
              ? 'The price changed since you started this checkout.'
              : `The price changed to ${formatCents(newPrice)} since you started this checkout.`}
          </p>
          <p>Nothing is charged until you confirm the new total and complete the order.</p>
          <button type="button" style={styles.button} onClick={confirmNewPrice} disabled={busy}>
            Confirm at new price
          </button>
        </div>
      ) : null}

      {notice ? (
        <p role="status" style={styles.notice}>
          {notice}
        </p>
      ) : null}

      <button
        type="button"
        style={styles.button}
        onClick={completeOrder}
        disabled={busy || priceChanged}
      >
        Complete purchase
      </button>
    </section>
  );
}
