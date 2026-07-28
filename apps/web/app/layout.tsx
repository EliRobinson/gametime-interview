import './globals.css';

import { cssVariables } from '@repo/tokens';
import type { Metadata } from 'next';
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
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.85rem 1.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
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
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
            <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Checkout</span>
          </div>
          <span style={{ width: 88 }} aria-hidden />
        </header>
        {children}
      </body>
    </html>
  );
}
