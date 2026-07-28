/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', '../../packages/ui/src/**/*.{js,jsx,ts,tsx}'],
  // Match mobile: only honor `dark:` when an ancestor has class `dark`
  // (not OS prefers-color-scheme), so web checkout stays light+black CTA.
  darkMode: 'class',
  presets: [require('nativewind/preset'), require('@repo/tokens/preset')],
};
