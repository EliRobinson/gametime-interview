import { z } from 'zod';

export const checkoutSessionStatus = z.enum([
  'active',
  'pending_payment',
  'completed',
  'expired',
  'failed',
]);
export type CheckoutSessionStatus = z.infer<typeof checkoutSessionStatus>;

// Why a session ended up `expired`. The session's own clock and the inventory
// hold are two independent expirations owned by two services, and the fan needs
// to be told which one lapsed — "your checkout expired" and "these tickets are
// gone" are different situations with different next steps.
export const sessionExpiryReason = z.enum(['session_lapsed', 'hold_released']);
export type SessionExpiryReason = z.infer<typeof sessionExpiryReason>;

export const checkoutSessionSchema = z.object({
  id: z.string(),
  listingId: z.string(),
  status: checkoutSessionStatus,
  priceAtCreation: z.number().nonnegative(),
  acknowledgedPrice: z.number().nonnegative(),
  createdAt: z.string(),
  expiresAt: z.string(),
  failureReason: z.string().nullable(),
  // Nullish rather than required so existing session fixtures stay valid and
  // only ever set for `status: 'expired'`.
  expiryReason: sessionExpiryReason.nullish(),
});
export type CheckoutSession = z.infer<typeof checkoutSessionSchema>;

export const createSessionInput = z.object({ listingId: z.string().min(1) });
export type CreateSessionInput = z.infer<typeof createSessionInput>;

export const checkoutSurface = z.enum(['web', 'mobile']);
export type CheckoutSurface = z.infer<typeof checkoutSurface>;

export const sessionIdInput = z.object({
  sessionId: z.string().min(1),
  surface: checkoutSurface.default('web'),
});
export type SessionIdInput = z.infer<typeof sessionIdInput>;

/**
 * Resume returns the session plus the live hold price (when still held) so
 * clients can map price_changed without a second client-side price clock.
 */
export const resumeSessionResultSchema = z.object({
  session: checkoutSessionSchema,
  livePriceCents: z.number().nonnegative().nullable(),
});
export type ResumeSessionResult = z.infer<typeof resumeSessionResultSchema>;

// The tRPC wire codes this checkout flow actually throws, named after the
// domain failure each one stands in for. Both clients switch on these to
// decide which recovery UI to show, so the API and the clients share this set
// instead of each hardcoding the same strings.
export const CHECKOUT_ERROR_CODE = {
  NOT_FOUND: 'NOT_FOUND',
  TIMEOUT: 'TIMEOUT',
  UNPROCESSABLE_CONTENT: 'UNPROCESSABLE_CONTENT',
  PRECONDITION_FAILED: 'PRECONDITION_FAILED',
  CONFLICT: 'CONFLICT',
} as const;
export type CheckoutErrorCode = (typeof CHECKOUT_ERROR_CODE)[keyof typeof CHECKOUT_ERROR_CODE];
