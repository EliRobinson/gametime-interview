import { colors } from '@repo/tokens';
import type { ReactNode } from 'react';
import { createContext, useContext } from 'react';

import type { Theme, ThemeName } from './themes';
import { themes } from './themes';

const ThemeContext = createContext<Theme>(themes.light);

export function ThemeProvider({
  theme: themeName,
  children,
}: {
  theme: ThemeName;
  children: ReactNode;
}) {
  return <ThemeContext.Provider value={themes[themeName]}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}

/** @deprecated Use `ThemeName` / `theme` prop — kept as a type alias for call-site clarity. */
export type Appearance = ThemeName;

/** Brand accent — shared across themes for ActivityIndicator etc. */
export const brandAccent = colors.accent;
