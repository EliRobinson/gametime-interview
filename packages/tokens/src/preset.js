// Keep hex values in sync with colors.ts / space.ts / radius.ts (CJS cannot import TS cleanly).
/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4F46E5',
          light: '#6366F1',
          dark: '#4338CA',
        },
        surface: '#FFFFFF',
        muted: '#6B7280',
        border: '#D8D8DD',
        banner: { DEFAULT: '#FDF6E3', border: '#B8860B' },
        notice: { border: '#8A8A90' },
        ink: '#111827',
      },
      spacing: {
        18: '4.5rem',
      },
      borderRadius: {
        md: '0.375rem',
        lg: '0.5rem',
      },
    },
  },
  plugins: [],
};
