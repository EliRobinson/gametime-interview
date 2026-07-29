import './globals.css';

import { cssVariables } from '@repo/tokens';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { CheckoutLeaveModeProvider } from './checkout-leave-mode';
import { SiteHeader } from './site-header';

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
        <CheckoutLeaveModeProvider>
          <SiteHeader />
          {children}
        </CheckoutLeaveModeProvider>
      </body>
    </html>
  );
}
