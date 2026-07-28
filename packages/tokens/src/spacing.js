'use strict';

/** Pixel scale — RN StyleSheet + source for CSS rem values. */
const spacePx = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  18: 72,
};

const radiusPx = {
  md: 8,
  lg: 12,
  /** Gametime CTAs are near-pill */
  full: 9999,
};

function pxToRem(pixels) {
  return `${pixels / 16}rem`;
}

const spaceCss = {
  1: pxToRem(spacePx[1]),
  2: pxToRem(spacePx[2]),
  3: pxToRem(spacePx[3]),
  4: pxToRem(spacePx[4]),
  5: pxToRem(spacePx[5]),
  6: pxToRem(spacePx[6]),
  8: pxToRem(spacePx[8]),
  18: pxToRem(spacePx[18]),
};

const radiusCss = {
  md: pxToRem(radiusPx.md),
  lg: pxToRem(radiusPx.lg),
  full: `${radiusPx.full}px`,
};

module.exports = { spacePx, radiusPx, spaceCss, radiusCss };
