'use client';

import { CHECKOUT_COPY } from '@repo/ui';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

function isCheckoutPath(pathname: string): boolean {
  return pathname.startsWith('/checkout/');
}

export function SiteHeader() {
  const pathname = usePathname();
  const showCancel = isCheckoutPath(pathname);

  return (
    <header className="site-header">
      <Link
        href="/"
        aria-label="Gametime home"
        className="site-header-logo"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          color: 'inherit',
          textDecoration: 'none',
          flexShrink: 0,
          justifySelf: 'start',
        }}
      >
        <span
          style={{
            fontWeight: 800,
            letterSpacing: '0.06em',
            fontSize: '1rem',
            textTransform: 'uppercase',
          }}
        >
          Gametime
        </span>
        <span
          aria-hidden
          style={{ color: 'var(--color-accent)', fontWeight: 800, fontSize: '1.1rem' }}
        >
          ›
        </span>
      </Link>

      {showCancel ? (
        <div className="site-header-cancel-layer">
          <div className="site-header-cancel-shell">
            <div className="site-header-cancel-grid">
              <div className="site-header-cancel-slot">
                <Link
                  href="/"
                  aria-label={CHECKOUT_COPY.cancelAriaLabel}
                  data-testid="checkout-cancel"
                  className="site-header-cancel"
                >
                  <span aria-hidden className="site-header-cancel-mark">
                    ‹
                  </span>
                  <span className="site-header-cancel-text" aria-hidden>
                    {CHECKOUT_COPY.cancelLabel}
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div
        className="site-header-title"
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifySelf: 'center' }}
      >
        <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{CHECKOUT_COPY.pageTitle}</span>
        <span
          aria-hidden
          style={{
            width: 18,
            height: 18,
            borderRadius: 999,
            backgroundColor: 'var(--color-accent)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            fontWeight: 800,
            color: 'var(--color-canvas)',
          }}
        >
          ✓
        </span>
      </div>

      <span aria-hidden />
    </header>
  );
}
