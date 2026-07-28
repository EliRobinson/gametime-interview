// Keep hex values in sync with colors.ts / space.ts / radius.ts (CJS cannot import TS cleanly).
// Source: https://gametime.co/ logo (#19CE85) + main CSS (#010314, #141517, #1C1C20, #0C0C0D, #FBE217).
/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#19CE85',
          dark: '#15AF71',
          light: '#52DAA3',
          muted: '#DCF7EC',
        },
        primary: {
          DEFAULT: '#19CE85',
          light: '#52DAA3',
          dark: '#15AF71',
        },
        canvas: {
          DEFAULT: '#0C0C0D',
          light: '#F5F5F5',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          dark: '#1C1C20',
          elevated: '#2A2A2E',
        },
        muted: '#5A5A5A',
        border: '#DFE2E7',
        cta: '#141517',
        banner: { DEFAULT: '#FFF8DC', border: '#E5C84A' },
        urgency: { DEFAULT: '#FBE217', bg: '#FFF8DC', border: '#FBE217' },
        notice: { border: '#DFE2E7' },
        ink: '#010314',
        'on-dark': '#F9F9FA',
      },
      spacing: {
        18: '4.5rem',
      },
      borderRadius: {
        md: '0.5rem',
        lg: '0.75rem',
        full: '9999px',
      },
    },
  },
  plugins: [],
};
