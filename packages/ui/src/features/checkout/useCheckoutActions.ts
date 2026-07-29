import type { CheckoutSession, CheckoutSurface, ResumeSessionResult } from '@repo/api-contracts';
import { trpcErrorCode } from '@repo/utils';
import type { Dispatch, SetStateAction } from 'react';
import { useCallback, useState } from 'react';

import type { CheckoutView } from './checkout.view-model';
import {
  priceUpdatedNotice,
  viewFromErrorCode,
  viewFromResume,
  viewFromSession,
} from './mapCheckoutView.util';

type CheckoutMutations = {
  complete: (input: { sessionId: string; surface: CheckoutSurface }) => Promise<CheckoutSession>;
  confirmPrice: (input: {
    sessionId: string;
    surface: CheckoutSurface;
  }) => Promise<CheckoutSession>;
  resume: (input: { sessionId: string; surface: CheckoutSurface }) => Promise<ResumeSessionResult>;
};

export type UseCheckoutActionsOptions = {
  surface: CheckoutSurface;
  mutations: CheckoutMutations;
  setView: Dispatch<SetStateAction<CheckoutView>>;
  /**
   * When false, skip applying the response (unmounted or superseded request).
   * Defaults to always apply.
   */
  shouldApply?: () => boolean;
  /** Extra work after a successful price confirm (e.g. expand breakdown). */
  onConfirmPriceSuccess?: () => void;
};

/**
 * Shared complete / confirmPrice / resume-refresh orchestration for web + mobile.
 * Platform chrome (leave guards, sticky footer, SSR) stays in each app.
 */
export function useCheckoutActions({
  surface,
  mutations,
  setView,
  shouldApply = () => true,
  onConfirmPriceSuccess,
}: UseCheckoutActionsOptions) {
  const [busy, setBusy] = useState(false);

  const completeOrder = useCallback(
    async (session: CheckoutSession) => {
      if (busy) return;
      setBusy(true);
      // Claim UI immediately — never leave Buy enabled while pending_payment.
      setView({ kind: 'processing', session: { ...session, status: 'pending_payment' } });
      try {
        const next = await mutations.complete({ sessionId: session.id, surface });
        if (shouldApply()) setView(viewFromSession(next));
      } catch (error) {
        if (shouldApply()) setView(viewFromErrorCode(trpcErrorCode(error), session));
      } finally {
        if (shouldApply()) setBusy(false);
      }
    },
    [busy, mutations, setView, shouldApply, surface],
  );

  const confirmNewPrice = useCallback(
    async (session: CheckoutSession) => {
      if (busy) return;
      setBusy(true);
      try {
        const next = await mutations.confirmPrice({ sessionId: session.id, surface });
        if (shouldApply()) {
          onConfirmPriceSuccess?.();
          setView(
            viewFromSession(
              next,
              priceUpdatedNotice(next.acknowledgedPrice),
              session.acknowledgedPrice,
            ),
          );
        }
      } catch (error) {
        if (shouldApply()) setView(viewFromErrorCode(trpcErrorCode(error), session));
      } finally {
        if (shouldApply()) setBusy(false);
      }
    },
    [busy, mutations, onConfirmPriceSuccess, setView, shouldApply, surface],
  );

  /** Re-resume after the demo countdown expires so live hold price is authoritative. */
  const refreshFromResume = useCallback(
    async (sessionId: string) => {
      try {
        const result = await mutations.resume({ sessionId, surface });
        if (shouldApply()) setView(viewFromResume(result.session, result.livePriceCents));
      } catch (error) {
        if (shouldApply()) setView(viewFromErrorCode(trpcErrorCode(error)));
      }
    },
    [mutations, setView, shouldApply, surface],
  );

  return { busy, completeOrder, confirmNewPrice, refreshFromResume };
}
