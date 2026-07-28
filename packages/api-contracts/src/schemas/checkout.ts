import { z } from 'zod';

export const checkoutSessionStatus = z.enum([
  'created',
  'active',
  'pending_payment',
  'completed',
  'expired',
  'failed',
]);
export type CheckoutSessionStatus = z.infer<typeof checkoutSessionStatus>;

export const checkoutSessionSchema = z.object({
  id: z.string(),
  listingId: z.string(),
  status: checkoutSessionStatus,
  priceAtCreation: z.number().nonnegative(),
  acknowledgedPrice: z.number().nonnegative(),
  createdAt: z.string(),
  expiresAt: z.string(),
  failureReason: z.string().nullable(),
});
export type CheckoutSession = z.infer<typeof checkoutSessionSchema>;

export const createSessionInput = z.object({ listingId: z.string().min(1) });
export type CreateSessionInput = z.infer<typeof createSessionInput>;

export const sessionIdInput = z.object({ sessionId: z.string().min(1) });
export type SessionIdInput = z.infer<typeof sessionIdInput>;
