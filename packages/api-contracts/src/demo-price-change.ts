/**
 * Demo-only listing that bumps its *held* price after a short delay so a
 * reviewer can watch the price-reconfirmation path without poking fakes by
 * hand. Catalog / placeHold always use the seeded price; only getHoldStatus
 * after the delay returns the bumped amount. Releasing the hold clears it.
 */
export const DEMO_PRICE_CHANGE = {
  listingId: 'listing_3',
  afterMs: 10_000,
  /** Absolute cents once the hold has aged past `afterMs`. */
  heldPriceAfterBumpCents: 10_900,
} as const;

/**
 * Milliseconds until the demo bump should surface for this session, or `null`
 * when the listing is not the demo ticket (or the fan already acknowledged the
 * bumped price). `0` means the bump is already due.
 */
export function msUntilDemoPriceBump(
  session: { listingId: string; createdAt: string; acknowledgedPrice?: number },
  nowMs: number = Date.now(),
): number | null {
  if (session.listingId !== DEMO_PRICE_CHANGE.listingId) return null;
  if (session.acknowledgedPrice === DEMO_PRICE_CHANGE.heldPriceAfterBumpCents) return null;
  const createdAtMs = Date.parse(session.createdAt);
  if (Number.isNaN(createdAtMs)) return null;
  return Math.max(0, DEMO_PRICE_CHANGE.afterMs - (nowMs - createdAtMs));
}
