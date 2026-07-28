import { statusLabel } from '../../../src/format';
import { resumeSession } from '../../../src/resume-session';
import { CheckoutClient } from './checkout-client';

// The session is resumed on every request with an uncached fetch, and the
// resumed status is authoritative (the API reconciles expiry and the inventory
// hold), so this route is dynamic by construction.
export const dynamic = 'force-dynamic';

const page = {
  main: {
    maxWidth: 520,
    margin: '0 auto',
    padding: '2rem 1.25rem',
    fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
    lineHeight: 1.5,
  },
  dl: { display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.25rem 1rem', margin: 0 },
  dt: { color: '#5a5a60' },
  dd: { margin: 0, textAlign: 'right' },
  id: { color: '#5a5a60', fontSize: '0.875rem', margin: 0 },
} as const;

export default async function CheckoutPage({ params }: { params: { id: string } }) {
  const result = await resumeSession(params.id);

  if (!result.ok) {
    return (
      <main style={page.main}>
        <h1>{result.headline}</h1>
        <p>{result.detail}</p>
        <p style={page.id}>Session {params.id}</p>
      </main>
    );
  }

  const { session } = result;

  return (
    <main style={page.main}>
      <h1>Your checkout</h1>
      <p style={page.id}>Session {session.id}</p>

      {/* Rendered on the server: a fan with JS disabled still sees the listing,
          the reconciled status and the price they agreed to. */}
      <dl style={page.dl}>
        <dt style={page.dt}>Listing</dt>
        <dd style={page.dd}>{session.listingId}</dd>
        <dt style={page.dt}>Status</dt>
        <dd style={page.dd}>{statusLabel(session.status)}</dd>
        <dt style={page.dt}>Holds until</dt>
        <dd style={page.dd}>{session.expiresAt}</dd>
      </dl>

      <CheckoutClient initialSession={session} />
    </main>
  );
}
