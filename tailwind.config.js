/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('nativewind/preset')],
  content: [
    './App.{js,jsx,ts,tsx}',
    './index.ts',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        surface: '#0f172a',
        card: '#1e293b',
        border: '#334155',
        'safe-green': '#22c55e',
        'caution-yellow': '#eab308',
        'danger-red': '#ef4444',
      },
    },
  },
  plugins: [],
};
