import type { CheckoutSession } from '@repo/api-contracts';

/**
 * Share is only offered while the session is still resumable — not after
 * completion, expiry, or while another surface has claimed `pending_payment`.
 */
export function isShareableSession(session: CheckoutSession): boolean {
  return session.status === 'created' || session.status === 'active' || session.status === 'failed';
}

export function buildCheckoutShareUrls(
  sessionId: string,
  webOrigin: string,
): { shareWebUrl: string; shareMobileUrl: string } {
  const origin = webOrigin.replace(/\/$/, '');
  return {
    shareWebUrl: `${origin}/checkout/${sessionId}`,
    shareMobileUrl: `mobileweb://checkout/${sessionId}`,
  };
}

/**
 * Payload for React Native `Share.share`.
 *
 * Message-only keeps a single share item (avoids iOS “2 Links” from
 * message+url) and puts the HTTPS URL on the pasteboard when the fan taps
 * Copy — iOS Copy often leaves the clipboard empty when only `url` is set.
 */
export function buildNativeSharePayload(webUrl: string): { message: string } {
  return { message: webUrl };
}
