import type { CheckoutSession } from '@repo/api-contracts';
import { formatCurrency } from '@repo/utils';

import { statusLabel } from '#web/format';

import { checkoutPageStyles as styles } from './checkout-page-styles';

/**
 * SSR-only order summary. Stays DOM + CSS vars (not RN) so first paint works
 * without JS; visual values still come from `@repo/tokens` via cssVariables.
 */
export function OrderSummary({ session }: { session: CheckoutSession }) {
  return (
    <aside style={styles.card}>
      <h2 style={styles.summaryTitle}>Order summary</h2>
      <p style={styles.id}>Session {session.id}</p>
      <dl style={styles.dl}>
        <dt style={styles.dt}>Listing</dt>
        <dd style={styles.dd}>{session.listingId}</dd>
        <dt style={styles.dt}>Status</dt>
        <dd style={styles.dd}>{statusLabel(session.status)}</dd>
        <dt style={styles.dt}>Holds until</dt>
        <dd style={styles.dd}>{session.expiresAt}</dd>
        <dt style={styles.dt}>Total</dt>
        <dd style={{ ...styles.dd, fontSize: '1.25rem' }}>
          {formatCurrency(session.acknowledgedPrice)}
        </dd>
      </dl>
      <div style={styles.deal}>You found a Super Deal! Top value seats for this event.</div>
    </aside>
  );
}
