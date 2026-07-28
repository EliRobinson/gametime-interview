import { formatCurrency } from '@repo/utils';

import { statusLabel } from '#web/format';
import { resumeSession } from '#web/resume-session';

import { CheckoutClient } from './checkout-client';

// The session is resumed on every request with an uncached fetch, and the
// resumed status is authoritative (the API reconciles expiry and the inventory
// hold), so this route is dynamic by construction.
export const dynamic = 'force-dynamic';

const page = {
  main: {
    maxWidth: 960,
    margin: '0 auto',
    padding: '1.5rem 1.25rem 3rem',
    lineHeight: 1.5,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.1fr) minmax(280px, 0.9fr)',
    gap: '1.25rem',
    alignItems: 'start',
  },
  card: {
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--radius-lg)',
    padding: '1.25rem 1.35rem',
    border: '1px solid var(--color-border)',
  },
  summaryTitle: {
    margin: '0 0 0.75rem',
    fontSize: '1.125rem',
    fontWeight: 700,
  },
  dl: {
    display: 'grid',
    gridTemplateColumns: 'auto 1fr',
    gap: '0.4rem 1rem',
    margin: 0,
  },
  dt: { color: 'var(--color-muted)', fontSize: '0.875rem' },
  dd: { margin: 0, textAlign: 'right' as const, fontWeight: 600 },
  id: { color: 'var(--color-muted)', fontSize: '0.8125rem', margin: '0 0 1rem' },
  deal: {
    marginTop: '1rem',
    padding: '0.75rem 1rem',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--color-accent-muted)',
    color: 'var(--color-accent-dark)',
    fontSize: '0.875rem',
    fontWeight: 600,
  },
  failure: {
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--radius-lg)',
    padding: '1.5rem',
    border: '1px solid var(--color-border)',
    maxWidth: 520,
  },
} as const;

export default async function CheckoutPage({ params }: { params: { id: string } }) {
  const result = await resumeSession(params.id);

  if (!result.ok) {
    return (
      <main style={page.main}>
        <section style={page.failure}>
          <h1 style={{ marginTop: 0 }}>{result.headline}</h1>
          <p>{result.detail}</p>
          <p style={page.id}>Session {params.id}</p>
        </section>
      </main>
    );
  }

  const { session } = result;

  return (
    <main style={page.main}>
      <div style={page.grid} className="checkout-grid">
        <section style={page.card}>
          <CheckoutClient initialSession={session} />
        </section>

        {/* SSR summary: fans with JS disabled still see listing, status, and price. */}
        <aside style={page.card}>
          <h2 style={page.summaryTitle}>Order summary</h2>
          <p style={page.id}>Session {session.id}</p>
          <dl style={page.dl}>
            <dt style={page.dt}>Listing</dt>
            <dd style={page.dd}>{session.listingId}</dd>
            <dt style={page.dt}>Status</dt>
            <dd style={page.dd}>{statusLabel(session.status)}</dd>
            <dt style={page.dt}>Holds until</dt>
            <dd style={page.dd}>{session.expiresAt}</dd>
            <dt style={page.dt}>Total</dt>
            <dd style={{ ...page.dd, fontSize: '1.25rem' }}>
              {formatCurrency(session.acknowledgedPrice)}
            </dd>
          </dl>
          <div style={page.deal}>You found a Super Deal! Top value seats for this event.</div>
        </aside>
      </div>
      <style>{`
        @media (max-width: 800px) {
          .checkout-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </main>
  );
}
