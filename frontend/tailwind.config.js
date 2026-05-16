/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: '#4FD1C5',
        'brand-light': '#E0F2F1',
        'brand-banner': '#E0F7FA',
        accent: '#FFD745',
        'accent-hover': '#FFC904',
        navy: '#1a1a2e',
        'blue-brand': '#65A1FB',
        'blue-mid': '#4a6fa5',
        'blue-light': '#7a9fd4',
      },
    },
  },
  plugins: [],
};
