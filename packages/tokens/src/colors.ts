/**
 * Gametime brand palette sampled from https://gametime.co/ (logo SVG + main CSS)
 * and production app screenshots. Keep `preset.js` hex values in sync.
 */
export const colors = {
  /** Brand mint — logo mark fill on gametime.co */
  accent: '#19CE85',
  accentDark: '#15AF71',
  accentLight: '#52DAA3',
  accentMuted: '#DCF7EC',

  /** Web checkout page background */
  canvasLight: '#F5F5F5',
  /** Mobile / marketing dark canvas (site body / icon fills) */
  canvas: '#0C0C0D',
  surfaceDark: '#1C1C20',
  surfaceDarkElevated: '#2A2A2E',

  /** Light surfaces (web cards, inputs) */
  surface: '#FFFFFF',
  border: '#DFE2E7',

  /** Text — `#010314` is the dominant ink in gametime.co CSS */
  text: '#010314',
  onDark: '#F9F9FA',
  muted: '#5A5A5A',

  /** Web primary purchase CTA (site “Continue” button) */
  cta: '#141517',

  /** Scarcity / urgency strip */
  urgency: '#FBE217',
  urgencyBg: '#FFF8DC',
  urgencyBorder: '#FBE217',

  /** Price-change / alert banner */
  bannerBg: '#FFF8DC',
  bannerBorder: '#E5C84A',

  /** Info notice on light surfaces */
  noticeBorder: '#DFE2E7',

  /** Legacy aliases — primary tracks brand accent for NativeWind `bg-primary` */
  primary: '#19CE85',
  primaryLight: '#52DAA3',
  primaryDark: '#15AF71',
} as const;
