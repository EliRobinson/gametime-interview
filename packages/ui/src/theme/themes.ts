import { colors, fontSizePx, fontWeight, radiusPx, spacePx } from '@repo/tokens';

export type ThemeName = 'light' | 'dark';

/**
 * Resolved visual tokens for one surface. Atoms read this instead of branching
 * on light/dark inline — keeps StyleSheet the only styling path in `@repo/ui`.
 */
export type Theme = {
  name: ThemeName;
  text: string;
  muted: string;
  ctaBackground: string;
  ctaLabel: string;
  secondaryBackground: string;
  secondaryLabel: string;
  noticeBackground: string;
  noticeBorder: string;
  bannerBackground: string;
  bannerBorder: string;
  skeleton: string;
  space: typeof spacePx;
  radius: typeof radiusPx;
  fontSize: typeof fontSizePx;
  fontWeight: typeof fontWeight;
};

const shared = {
  space: spacePx,
  radius: radiusPx,
  fontSize: fontSizePx,
  fontWeight,
  muted: colors.muted,
  bannerBackground: colors.bannerBg,
  bannerBorder: colors.bannerBorder,
  noticeBorder: colors.accent,
} as const;

export const themes: Record<ThemeName, Theme> = {
  light: {
    ...shared,
    name: 'light',
    text: colors.text,
    ctaBackground: colors.cta,
    ctaLabel: colors.onDark,
    secondaryBackground: colors.border,
    secondaryLabel: colors.text,
    noticeBackground: colors.accentMuted,
    skeleton: colors.border,
  },
  dark: {
    ...shared,
    name: 'dark',
    text: colors.onDark,
    ctaBackground: colors.accent,
    ctaLabel: colors.onDark,
    secondaryBackground: colors.surfaceDarkElevated,
    secondaryLabel: colors.onDark,
    noticeBackground: colors.surfaceDark,
    skeleton: colors.surfaceDarkElevated,
  },
};
