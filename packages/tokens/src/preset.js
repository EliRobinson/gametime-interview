// Keep hex values in sync with colors.ts / space.ts / radius.ts (CJS cannot import TS cleanly).
/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#00D692',
          dark: '#00B87A',
          muted: '#E8FFF5',
        },
        primary: {
          DEFAULT: '#00D692',
          light: '#22E0A4',
          dark: '#00B87A',
        },
        canvas: {
          DEFAULT: '#000000',
          light: '#F5F5F5',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          dark: '#1C1C1E',
          elevated: '#262626',
        },
        muted: '#8E8E93',
        border: '#E5E5EA',
        cta: '#000000',
        banner: { DEFAULT: '#FFF8DC', border: '#E5C84A' },
        urgency: { DEFAULT: '#F5D547', bg: '#FFF8DC', border: '#E5C84A' },
        notice: { border: '#C7C7CC' },
        ink: '#111111',
        'on-dark': '#FFFFFF',
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
