/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      screens: {
        xs: '375px',
      },
      colors: {
        primary: {
          DEFAULT: '#E6192E',
          dark: '#b11324',
          light: '#f04455',
        },
        surface: {
          light: '#f6faff',
          dark: '#0f172a',
        },
        card: {
          light: '#ffffff',
          dark: '#1e293b',
        },
      },
      fontFamily: {
        heading: ['Lexend', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};