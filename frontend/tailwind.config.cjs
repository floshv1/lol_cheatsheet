/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy:  { DEFAULT: '#0A0E1A', light: '#0F1923' },
        gold:  { DEFAULT: '#C8AA6E', dark: '#785A28' },
        panel: { DEFAULT: '#1E2D3D', light: '#2A3F55' },
        cream: '#E8E0D0',
        danger: '#C0393A',
        easy:   '#5CA85B',
        hard:   '#C0393A',
      },
    },
  },
  plugins: [],
}
