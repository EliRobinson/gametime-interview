/* eslint-disable @typescript-eslint/no-require-imports -- CJS palette shared with preset.js */
// Shared with `preset.js` via CommonJS — keep values only in palette.js.
const { colors: paletteColors } = require('./palette.js') as {
  colors: {
    readonly accent: '#19CE85';
    readonly accentDark: '#15AF71';
    readonly accentLight: '#52DAA3';
    readonly accentMuted: '#DCF7EC';
    readonly canvasLight: '#F5F5F5';
    readonly canvas: '#0C0C0D';
    readonly surfaceDark: '#1C1C20';
    readonly surfaceDarkElevated: '#2A2A2E';
    readonly surface: '#FFFFFF';
    readonly border: '#DFE2E7';
    readonly text: '#010314';
    readonly onDark: '#F9F9FA';
    readonly muted: '#5A5A5A';
    readonly cta: '#141517';
    readonly urgency: '#FBE217';
    readonly urgencyBg: '#FFF8DC';
    readonly urgencyBorder: '#FBE217';
    readonly bannerBg: '#FFF8DC';
    readonly bannerBorder: '#E5C84A';
    readonly noticeBorder: '#DFE2E7';
    readonly primary: '#19CE85';
    readonly primaryLight: '#52DAA3';
    readonly primaryDark: '#15AF71';
  };
};

/**
 * Gametime brand palette. Values live in `palette.js` so Tailwind's CJS preset
 * and TypeScript consumers share one source.
 */
export const colors = paletteColors;
