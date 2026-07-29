import './globals.css';

import { cssVariables } from '@repo/tokens';
import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Tickets · Gametime',
  description: 'Select seats and resume checkout on any device.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <style dangerouslySetInnerHTML={{ __html: cssVariables }} />
      </head>
      <body
        style={{
          backgroundColor: 'var(--color-canvas-light)',
          color: 'var(--color-text)',
          margin: 0,
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        <header
          style={{
            backgroundColor: 'var(--color-canvas)',
            color: 'var(--color-on-dark)',
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            alignItems: 'center',
            padding: '0.85rem 1.5rem',
          }}
        >
          <Link
            href="/"
            aria-label="Gametime home"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              color: 'inherit',
              textDecoration: 'none',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Checkout</span>
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
        {children}
      </body>
    </html>
  );
}
