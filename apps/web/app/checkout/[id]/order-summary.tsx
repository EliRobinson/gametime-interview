import type { CheckoutSession } from '@repo/api-contracts';
import type { CheckoutPresentation } from '@repo/ui/server';
import { CHECKOUT_COPY, stadiumMapImageSrcSet } from '@repo/ui/server';

import { statusLabel } from '#web/format';

import { checkoutPageStyles as styles } from './checkout-page-styles';

/**
 * SSR-friendly order summary. Stays DOM + CSS vars (not RN) so first paint works
 * without JS; visual values still come from `@repo/tokens` via cssVariables.
 * Callers pass a live `presentation` so client confirms can update prices.
 */
export function OrderSummary({
  session,
  presentation,
}: {
  session: CheckoutSession;
  presentation: CheckoutPresentation;
}) {
  const seatNote = presentation.seatCount !== null ? ` · ${presentation.seatCount} seats` : '';
  const stadiumImage = stadiumMapImageSrcSet();

  return (
    <aside style={styles.summaryAside} aria-label="Order summary">
      <div style={styles.summaryCard}>
        <div style={styles.map} data-testid="checkout-stadium-map">
          <img
            src={stadiumImage.src}
            srcSet={stadiumImage.srcSet}
            sizes="(max-width: 800px) 100vw, 360px"
            alt=""
            style={styles.mapImage}
          />
          {presentation.mapBubble ? (
            <span
              data-testid="checkout-map-bubble"
              style={{
                ...styles.mapBubble,
                left: `${presentation.mapBubble.leftPct}%`,
                top: `${presentation.mapBubble.topPct}%`,
                backgroundColor: presentation.mapBubble.isSuperDeal
                  ? 'var(--color-accent)'
                  : 'var(--color-cta)',
                // Accent green fails WCAG with light glyphs (~2:1); dark ink clears AAA.
                color: presentation.mapBubble.isSuperDeal
                  ? 'var(--color-canvas)'
                  : 'var(--color-on-dark)',
              }}
            >
              {presentation.mapBubble.isSuperDeal ? '★' : '●'}
            </span>
          ) : null}
        </div>

        <p style={styles.venueLine}>
          {presentation.venue} · {presentation.city}
        </p>
        <h2 style={styles.artist}>{presentation.artist}</h2>
        <p style={styles.meta}>{presentation.datetimeLabel}</p>
        <p style={styles.meta}>{presentation.seatLineWeb}</p>
        {presentation.seatsTogetherLabel ? (
          <p style={styles.muted}>{presentation.seatsTogetherLabel}</p>
        ) : null}
        <p style={styles.muted}>{presentation.deliveryLabel}</p>
        <p style={styles.id}>
          {presentation.listingId} · {statusLabel(session.status)}
        </p>
      </div>

      {presentation.urgencyLabel ? (
        <div style={styles.urgency} role="status">
          ⚡ {presentation.urgencyLabel} ⚡
        </div>
      ) : null}

      <div style={{ ...styles.summaryCard, gap: 'var(--space-2)' }}>
        <p style={styles.priceRow}>
          <span>{CHECKOUT_COPY.ticketsLabel}</span>
          <span
            data-testid="ssr-ticket-unit-price"
            style={{ display: 'inline-flex', gap: 8, alignItems: 'baseline' }}
          >
            {presentation.formattedPreviousUnitPrice ? (
              <span
                data-testid="previous-unit-price"
                style={{
                  fontSize: '0.875rem',
                  color: 'var(--color-muted)',
                  textDecoration: 'line-through',
                }}
              >
                {presentation.formattedPreviousUnitPrice}
              </span>
            ) : null}
            <span>
              {presentation.formattedUnitPrice}
              {seatNote}
            </span>
          </span>
        </p>
        {presentation.showDecorativeChrome ? (
          <p style={styles.promo}>{CHECKOUT_COPY.addPromoCode}</p>
        ) : null}
        <p style={styles.priceRow}>
          <span style={styles.totalLabel}>{CHECKOUT_COPY.totalLabel}</span>
          <span style={styles.totalValue} data-testid="ssr-acknowledged-price">
            {presentation.formattedTotal}
          </span>
        </p>
      </div>

      {presentation.isSuperDeal ? (
        <div style={styles.deal} data-testid="ssr-super-deal">
          <p style={styles.dealTitle}>{CHECKOUT_COPY.superDealTitle}</p>
          <p style={styles.dealBody}>{CHECKOUT_COPY.superDealBody}</p>
        </div>
      ) : null}
    </aside>
  );
}
