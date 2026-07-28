/**
 * Gametime brand palette extracted from production web + mobile screenshots.
 * Keep `preset.js` hex values in sync with this file.
 */
export const colors = {
  /** Brand mint — logo chevron, mobile CTA, deal accents */
  accent: '#00D692',
  accentDark: '#00B87A',
  accentMuted: '#E8FFF5',

  /** Web checkout page background */
  canvasLight: '#F5F5F5',
  /** Mobile / dark surfaces */
  canvas: '#000000',
  surfaceDark: '#1C1C1E',
  surfaceDarkElevated: '#262626',

  /** Light surfaces (web cards, inputs) */
  surface: '#FFFFFF',
  border: '#E5E5EA',

  /** Text */
  text: '#111111',
  onDark: '#FFFFFF',
  muted: '#8E8E93',

  /** Web primary purchase CTA (black pill/button) */
  cta: '#000000',

  /** Scarcity / urgency strip */
  urgency: '#F5D547',
  urgencyBg: '#FFF8DC',
  urgencyBorder: '#F5D547',

  /** Price-change / alert banner (reuse urgency family) */
  bannerBg: '#FFF8DC',
  bannerBorder: '#E5C84A',

  /** Info notice on light surfaces */
  noticeBorder: '#C7C7CC',

  /** Legacy aliases — primary tracks brand accent for NativeWind `bg-primary` */
  primary: '#00D692',
  primaryLight: '#22E0A4',
  primaryDark: '#00B87A',
} as const;
