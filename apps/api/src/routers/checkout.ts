import {
  CHECKOUT_ERROR_CODE,
  checkoutSessionSchema,
  createSessionInput,
  resumeSessionResultSchema,
  sessionIdInput,
} from '@repo/api-contracts';
import { TRPCError } from '@trpc/server';

import {
  ConflictError,
  ListingUnavailableError,
  PriceChangedError,
  SessionExpiredError,
  SessionNotFoundError,
} from '../domain/checkout-service';
import { publicProcedure, router } from '../trpc';

// Each domain failure gets its own wire code so a client can tell the four
// recovery states apart without string-matching messages. There is no HTTP-410
// `GONE` in tRPC's code table, so session expiration (the session's own clock
// lapsed) maps to TIMEOUT and listing unavailability (the inventory hold was
// released independently) maps to UNPROCESSABLE_CONTENT. CONFLICT stays
// reserved for the duplicate-completion race.
function toTRPCError(error: unknown): TRPCError {
  if (error instanceof SessionNotFoundError)
    return new TRPCError({
      code: CHECKOUT_ERROR_CODE.NOT_FOUND,
      message: error.message,
      cause: error,
    });
  if (error instanceof SessionExpiredError)
    return new TRPCError({
      code: CHECKOUT_ERROR_CODE.TIMEOUT,
      message: error.message,
      cause: error,
    });
  if (error instanceof ListingUnavailableError)
    return new TRPCError({
      code: CHECKOUT_ERROR_CODE.UNPROCESSABLE_CONTENT,
      message: error.message,
      cause: error,
    });
  if (error instanceof PriceChangedError)
    return new TRPCError({
      code: CHECKOUT_ERROR_CODE.PRECONDITION_FAILED,
      message: error.message,
      cause: error,
    });
  if (error instanceof ConflictError)
    return new TRPCError({
      code: CHECKOUT_ERROR_CODE.CONFLICT,
      message: error.message,
      cause: error,
    });
  return new TRPCError({ code: 'INTERNAL_SERVER_ERROR', cause: error });
}

function withDomainErrors<T>(run: () => Promise<T>): Promise<T> {
  return run().catch((error: unknown) => {
    throw toTRPCError(error);
  });
}

export const checkoutRouter = router({
  create: publicProcedure
    .input(createSessionInput)
    .output(checkoutSessionSchema)
    .mutation(({ ctx, input }) =>
      withDomainErrors(() => ctx.checkout.createSession(input.listingId)),
    ),

  resume: publicProcedure
    .input(sessionIdInput)
    .output(resumeSessionResultSchema)
    .mutation(({ ctx, input }) =>
      withDomainErrors(() => ctx.checkout.resumeSession(input.sessionId, input.surface)),
    ),

  confirmPrice: publicProcedure
    .input(sessionIdInput)
    .output(checkoutSessionSchema)
    .mutation(({ ctx, input }) =>
      withDomainErrors(() => ctx.checkout.confirmPrice(input.sessionId)),
    ),

  complete: publicProcedure
    .input(sessionIdInput)
    .output(checkoutSessionSchema)
    .mutation(({ ctx, input }) =>
      withDomainErrors(() => ctx.checkout.completeSession(input.sessionId, input.surface)),
    ),

  release: publicProcedure
    .input(sessionIdInput)
    .output(checkoutSessionSchema)
    .mutation(({ ctx, input }) =>
      withDomainErrors(() => ctx.checkout.releaseSession(input.sessionId, input.surface)),
    ),
});
