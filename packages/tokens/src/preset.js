'use strict';

/* Tailwind presets must be CJS `require()`-able from app configs. */
/* eslint-disable @typescript-eslint/no-require-imports */
const { colors } = require('./palette.js');
const { spaceCss, radiusCss } = require('./spacing.js');
/* eslint-enable @typescript-eslint/no-require-imports */

/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: colors.accent,
          dark: colors.accentDark,
          light: colors.accentLight,
          muted: colors.accentMuted,
        },
        primary: {
          DEFAULT: colors.primary,
          light: colors.primaryLight,
          dark: colors.primaryDark,
        },
        canvas: {
          DEFAULT: colors.canvas,
          light: colors.canvasLight,
        },
        surface: {
          DEFAULT: colors.surface,
          dark: colors.surfaceDark,
          elevated: colors.surfaceDarkElevated,
        },
        muted: colors.muted,
        border: colors.border,
        cta: colors.cta,
        banner: { DEFAULT: colors.bannerBg, border: colors.bannerBorder },
        urgency: {
          DEFAULT: colors.urgency,
          bg: colors.urgencyBg,
          border: colors.urgencyBorder,
        },
        notice: { border: colors.noticeBorder },
        ink: colors.text,
        'on-dark': colors.onDark,
      },
      spacing: {
        18: spaceCss[18],
      },
      borderRadius: {
        md: radiusCss.md,
        lg: radiusCss.lg,
        full: radiusCss.full,
      },
    },
  },
  plugins: [],
};
