/**
 * Web checkout chrome styles. Values reference CSS custom properties emitted
 * by `@repo/tokens` `cssVariables` — no local hex. Kept as DOM styles because
 * this shell is SSR HTML (not react-native-web).
 */
export const checkoutPageStyles = {
  main: {
    maxWidth: 960,
    margin: '0 auto',
    padding: '1.5rem 1.25rem 3rem',
    lineHeight: 1.5,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.1fr) minmax(280px, 0.9fr)',
    gap: '1.25rem',
    alignItems: 'start',
  },
  card: {
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--radius-lg)',
    padding: '1.25rem 1.35rem',
    border: '1px solid var(--color-border)',
  },
  summaryTitle: {
    margin: '0 0 0.75rem',
    fontSize: '1.125rem',
    fontWeight: 700,
  },
  dl: {
    display: 'grid',
    gridTemplateColumns: 'auto 1fr',
    gap: '0.4rem 1rem',
    margin: 0,
  },
  dt: { color: 'var(--color-muted)', fontSize: '0.875rem' },
  dd: { margin: 0, textAlign: 'right' as const, fontWeight: 600 },
  id: { color: 'var(--color-muted)', fontSize: '0.8125rem', margin: '0 0 1rem' },
  deal: {
    marginTop: '1rem',
    padding: '0.75rem 1rem',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--color-accent-muted)',
    color: 'var(--color-accent-dark)',
    fontSize: '0.875rem',
    fontWeight: 600,
  },
  failure: {
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--radius-lg)',
    padding: '1.5rem',
    border: '1px solid var(--color-border)',
    maxWidth: 520,
  },
} as const;
