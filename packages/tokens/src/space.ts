/* eslint-disable @typescript-eslint/no-require-imports -- CJS spacing shared with preset.js */
// Shared with `preset.js` via CommonJS — keep values only in spacing.js.
const { radiusCss, radiusPx, spaceCss, spacePx } = require('./spacing.js') as {
  spacePx: {
    readonly 1: 4;
    readonly 2: 8;
    readonly 3: 12;
    readonly 4: 16;
    readonly 5: 20;
    readonly 6: 24;
    readonly 8: 32;
    readonly 18: 72;
  };
  radiusPx: {
    readonly md: 8;
    readonly lg: 12;
    readonly full: 9999;
  };
  spaceCss: {
    readonly 1: string;
    readonly 2: string;
    readonly 3: string;
    readonly 4: string;
    readonly 5: string;
    readonly 6: string;
    readonly 8: string;
    readonly 18: string;
  };
  radiusCss: {
    readonly md: string;
    readonly lg: string;
    readonly full: string;
  };
};

export { radiusPx, spacePx };

/** CSS rem strings derived from `spacePx` / `radiusPx`. */
export const space = spaceCss;
export const radius = radiusCss;
