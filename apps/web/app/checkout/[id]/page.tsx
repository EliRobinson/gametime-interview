import type { CheckoutSession } from '@repo/api-contracts';
import { CHECKOUT_COPY, mapCheckoutPresentation } from '@repo/ui/server';

import { resumeSession } from '#web/resume-session';

import { CheckoutClient } from './checkout-client';
import { checkoutPageStyles as styles } from './checkout-page-styles';
import { OrderSummary } from './order-summary';

// The session is resumed on every request with an uncached fetch, and the
// resumed status is authoritative (the API reconciles expiry and the inventory
// hold), so this route is dynamic by construction.
export const dynamic = 'force-dynamic';

function isDecorativeStatus(status: CheckoutSession['status']): boolean {
  return status === 'created' || status === 'active' || status === 'failed';
}

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

  const { session } = result;
  const presentation = mapCheckoutPresentation(session);
  const showDecorative = isDecorativeStatus(session.status);

  return (
    <main style={styles.main}>
      <div style={styles.grid} className="checkout-grid">
        <section style={styles.card}>
          <div style={styles.contactRow} data-testid="checkout-contact-row">
            <p style={styles.contactLabel}>{CHECKOUT_COPY.contactLabel}</p>
            <p style={styles.contactEmail}>{CHECKOUT_COPY.contactEmail}</p>
          </div>

          <CheckoutClient initialSession={session} />

          {showDecorative && presentation.showDecorativeChrome ? (
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

        {/* SSR summary: fans with JS disabled still see listing, status, and price. */}
        <OrderSummary session={session} />
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
