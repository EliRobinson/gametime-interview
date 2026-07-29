'use strict';

/**
 * Sole color source for `@repo/tokens`.
 * Consumed by `colors.ts` (TS/RN) and `preset.js` (Tailwind/NativeWind).
 * Hex values sampled from https://gametime.co/ (logo SVG + main CSS).
 */
const accent = '#19CE85';
const accentDark = '#15AF71';
const accentLight = '#52DAA3';

const colors = {
  /** Brand mint — logo mark fill on gametime.co */
  accent,
  accentDark,
  accentLight,
  accentMuted: '#DCF7EC',

  /** Web checkout page background */
  canvasLight: '#F5F5F5',
  /** Mobile / marketing dark canvas */
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

  /** Web primary purchase CTA */
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

  /** Gametime Guarantee shield / stadium bowl (checkout + listings map) */
  guarantee: '#6B4C9A',
  stadiumBowl: '#9B8EC4',
  stadiumBowlDark: '#3A2F55',
  stadiumField: '#6FAE86',
  stadiumFieldDark: '#1A3D2E',
  stadiumStage: '#5A5A5A',
  stadiumMapBg: '#E8EAEF',
  stadiumMapBgDark: '#141418',

  /** Inline links (promo, terms) */
  link: '#2563EB',

  /** NativeWind `bg-primary` aliases — same hex as accent* */
  primary: accent,
  primaryLight: accentLight,
  primaryDark: accentDark,
};

module.exports = { colors };
