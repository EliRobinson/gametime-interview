import './globals.css';

import { cssVariables } from '@repo/tokens';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Checkout',
  description: 'Resume your checkout on any device.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <style dangerouslySetInnerHTML={{ __html: cssVariables }} />
      </head>
      <body
        style={{
          backgroundColor: 'var(--color-surface)',
          color: 'var(--color-text)',
          margin: 0,
        }}
      >
        {children}
      </body>
    </html>
  );
}
