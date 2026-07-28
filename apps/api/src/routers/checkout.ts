import { checkoutSessionSchema, createSessionInput, sessionIdInput } from '@repo/api-contracts';
import { TRPCError } from '@trpc/server';

import {
  ConflictError,
  ListingUnavailableError,
  PriceChangedError,
  SessionExpiredError,
  SessionNotFoundError,
} from '../domain/checkout-service';
import { publicProcedure, router } from '../trpc';

function toTRPCError(error: unknown): TRPCError {
  if (error instanceof SessionNotFoundError)
    return new TRPCError({ code: 'NOT_FOUND', message: error.message, cause: error });
  if (error instanceof SessionExpiredError)
    return new TRPCError({ code: 'NOT_FOUND', message: error.message, cause: error });
  if (error instanceof ListingUnavailableError)
    return new TRPCError({ code: 'CONFLICT', message: error.message, cause: error });
  if (error instanceof PriceChangedError)
    return new TRPCError({ code: 'PRECONDITION_FAILED', message: error.message, cause: error });
  if (error instanceof ConflictError)
    return new TRPCError({ code: 'CONFLICT', message: error.message, cause: error });
  return new TRPCError({ code: 'INTERNAL_SERVER_ERROR', cause: error });
}

export const checkoutRouter = router({
  create: publicProcedure
    .input(createSessionInput)
    .output(checkoutSessionSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await ctx.checkout.createSession(input.listingId);
      } catch (error) {
        throw toTRPCError(error);
      }
    }),

  resume: publicProcedure
    .input(sessionIdInput)
    .output(checkoutSessionSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await ctx.checkout.resumeSession(input.sessionId, input.surface);
      } catch (error) {
        throw toTRPCError(error);
      }
    }),

  confirmPrice: publicProcedure
    .input(sessionIdInput)
    .output(checkoutSessionSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await ctx.checkout.confirmPrice(input.sessionId);
      } catch (error) {
        throw toTRPCError(error);
      }
    }),

  complete: publicProcedure
    .input(sessionIdInput)
    .output(checkoutSessionSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await ctx.checkout.completeSession(input.sessionId, input.surface);
      } catch (error) {
        throw toTRPCError(error);
      }
    }),
});
