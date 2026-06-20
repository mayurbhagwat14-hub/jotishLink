/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#ff8c00",
        orange: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#ff8c00', // Our custom Astrotalk orange
          600: '#ff8c00', // Override 600 too
          700: '#e07a00',
          800: '#9a3412',
          900: '#7c2d12',
        }
      },
      boxShadow: {
        'card': '0 2px 10px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 10px 25px rgba(0, 0, 0, 0.12)',
      }
    },
  },
  plugins: [],
}
