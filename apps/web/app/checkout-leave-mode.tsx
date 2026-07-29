'use client';

import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';

/**
 * How the checkout header leave control should read.
 * `done` only after a successful purchase — not for expired / abandoned exits.
 */
export type CheckoutLeaveMode = 'cancel' | 'done';

type CheckoutLeaveModeContextValue = {
  leaveMode: CheckoutLeaveMode;
  setLeaveMode: (mode: CheckoutLeaveMode) => void;
};

const noopSetLeaveMode = (_mode: CheckoutLeaveMode) => {
  // Outside the provider (e.g. isolated SSR tests) — header stays on Cancel.
};

const CheckoutLeaveModeContext = createContext<CheckoutLeaveModeContextValue>({
  leaveMode: 'cancel',
  setLeaveMode: noopSetLeaveMode,
});

export function CheckoutLeaveModeProvider({ children }: { children: ReactNode }) {
  const [leaveMode, setLeaveModeState] = useState<CheckoutLeaveMode>('cancel');
  const setLeaveMode = useCallback((mode: CheckoutLeaveMode) => {
    setLeaveModeState(mode);
  }, []);
  const value = useMemo(() => ({ leaveMode, setLeaveMode }), [leaveMode, setLeaveMode]);

  return (
    <CheckoutLeaveModeContext.Provider value={value}>{children}</CheckoutLeaveModeContext.Provider>
  );
}

export function useCheckoutLeaveMode(): CheckoutLeaveModeContextValue {
  return useContext(CheckoutLeaveModeContext);
}
