import type { CheckoutSession } from '@repo/api-contracts';

import type { CheckoutView } from './checkout.view-model';

/** Session still open for resume / share / retry — not terminal and not mid-charge. */
export function isShareableSession(session: CheckoutSession): boolean {
  return session.status === 'active' || session.status === 'failed';
}

/** Statuses that may still show decorative chrome when the view kind allows it. */
export function isDecorativeSessionStatus(status: CheckoutSession['status']): boolean {
  return status === 'active' || status === 'failed';
}

/**
 * View kinds that keep Buy / confirm / retry (and related sticky chrome) visible.
 * Mirrors terms visibility on web and sticky footer actions on mobile.
 */
export function showsCheckoutActions(view: CheckoutView): boolean {
  return view.kind === 'ready' || view.kind === 'price_changed' || view.kind === 'failed';
}

/** View kinds where deal / promo / guarantee chrome should hide. */
export const TERMINAL_VIEW_KINDS = new Set<CheckoutView['kind']>([
  'completed',
  'expired',
  'unavailable',
  'claimed_elsewhere',
  'processing',
  'not_found',
  'error',
]);

export function showsDecorativeChrome(viewKind: CheckoutView['kind'] | undefined): boolean {
  return viewKind === undefined || !TERMINAL_VIEW_KINDS.has(viewKind);
}

export function sessionFromView(view: CheckoutView): CheckoutSession | null {
  return 'session' in view && view.session ? view.session : null;
}
