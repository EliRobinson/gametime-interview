'use strict';

/** Pixel type scale — RN StyleSheet + source for CSS rem values. */
const fontSizePx = {
  xs: 12,
  sm: 14,
  base: 16,
  md: 15,
  xl: 20,
  '2xl': 24,
  '4xl': 36,
};

const fontWeight = {
  normal: '400',
  semibold: '600',
  bold: '700',
};

function pxToRem(pixels) {
  return `${pixels / 16}rem`;
}

const fontSizeCss = {
  xs: pxToRem(fontSizePx.xs),
  sm: pxToRem(fontSizePx.sm),
  base: pxToRem(fontSizePx.base),
  md: pxToRem(fontSizePx.md),
  xl: pxToRem(fontSizePx.xl),
  '2xl': pxToRem(fontSizePx['2xl']),
  '4xl': pxToRem(fontSizePx['4xl']),
};

module.exports = { fontSizePx, fontSizeCss, fontWeight };
