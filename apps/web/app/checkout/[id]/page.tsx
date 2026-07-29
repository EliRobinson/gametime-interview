import { resumeSession } from '#web/resume-session';

import { CheckoutClient } from './checkout-client';
import { checkoutPageStyles as styles } from './checkout-page-styles';

// The session is resumed on every request with an uncached fetch, and the
// resumed status is authoritative (the API reconciles expiry and the inventory
// hold), so this route is dynamic by construction.
export const dynamic = 'force-dynamic';

export default async function CheckoutPage({ params }: { params: { id: string } }) {
  const result = await resumeSession(params.id);

  if (!result.ok) {
    return (
      <main style={styles.main}>
        <section style={styles.failure}>
          <h1 style={{ marginTop: 0 }}>{result.headline}</h1>
          <p>{result.detail}</p>
          <p style={styles.id}>Session {params.id}</p>
        </section>
      </main>
    );
  }

  return (
    <main style={styles.main}>
      <CheckoutClient initialSession={result.session} />
    </main>
  );
}
