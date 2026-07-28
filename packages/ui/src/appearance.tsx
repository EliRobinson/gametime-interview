import type { ReactNode } from 'react';
import { createContext, useContext } from 'react';

/** Light = web checkout chrome; dark = Gametime mobile canvas. */
export type Appearance = 'light' | 'dark';

const AppearanceContext = createContext<Appearance>('light');

export function AppearanceProvider({
  appearance,
  children,
}: {
  appearance: Appearance;
  children: ReactNode;
}) {
  return <AppearanceContext.Provider value={appearance}>{children}</AppearanceContext.Provider>;
}

export function useAppearance(): Appearance {
  return useContext(AppearanceContext);
}
