/* eslint-disable @typescript-eslint/no-require-imports -- CJS type-scale shared with consumers */
// Shared CJS source — keep values only in type-scale.js (not typography.js, which
// would collide with this module under ts-jest / Node resolution).
const {
  fontSizeCss,
  fontSizePx,
  fontWeight: rawFontWeight,
} = require('./type-scale.js') as {
  fontSizePx: {
    readonly xs: 12;
    readonly sm: 14;
    readonly base: 16;
    readonly md: 15;
    readonly xl: 20;
    readonly '2xl': 24;
    readonly '4xl': 36;
  };
  fontSizeCss: {
    readonly xs: string;
    readonly sm: string;
    readonly base: string;
    readonly md: string;
    readonly xl: string;
    readonly '2xl': string;
    readonly '4xl': string;
  };
  fontWeight: {
    readonly normal: '400';
    readonly semibold: '600';
    readonly bold: '700';
  };
};

export { fontSizePx };

export const fontSize = fontSizeCss;
export const fontWeight = rawFontWeight;
