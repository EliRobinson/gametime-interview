import { colors } from './colors';
import { radius, space } from './space';
import { fontSize } from './typography';

export const cssVariables = `:root {
  --color-primary: ${colors.primary};
  --color-primary-light: ${colors.primaryLight};
  --color-primary-dark: ${colors.primaryDark};
  --color-surface: ${colors.surface};
  --color-muted: ${colors.muted};
  --color-border: ${colors.border};
  --color-banner-bg: ${colors.bannerBg};
  --color-banner-border: ${colors.bannerBorder};
  --color-notice-border: ${colors.noticeBorder};
  --color-text: ${colors.text};
  --radius-md: ${radius.md};
  --radius-lg: ${radius.lg};
  --font-size-base: ${fontSize.base};
  --space-4: ${space[4]};
  --space-5: ${space[5]};
  --space-6: ${space[6]};
  --space-8: ${space[8]};
}`;
