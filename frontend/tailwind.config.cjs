/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
      },
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
        },
        // Store design system — Shopline-inspired premium palette
        store: {
          bg: '#FBF8F4',        // Warm cream background
          card: '#FFFFFF',       // Pure white cards
          surface: '#F7F4EF',   // Slightly darker surface
          border: '#F0ECE5',    // Soft warm border
          muted: '#A8A29E',     // Muted text
          text: '#1C1917',      // Primary dark text
          subtitle: '#57534E',  // Secondary text
        }
      },
      boxShadow: {
        'card': '0 2px 10px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 10px 25px rgba(0, 0, 0, 0.12)',
        // Store-specific shadows
        'store-sm': '0 1px 3px rgba(28, 25, 23, 0.04)',
        'store': '0 2px 12px rgba(28, 25, 23, 0.06)',
        'store-md': '0 4px 20px rgba(28, 25, 23, 0.08)',
        'store-lg': '0 8px 32px rgba(28, 25, 23, 0.10)',
        'store-top': '0 -4px 20px rgba(28, 25, 23, 0.06)',
      },
      borderRadius: {
        'store': '16px',
        'store-lg': '20px',
        'store-xl': '24px',
      },
      animation: {
        'shimmer': 'shimmer 2s infinite linear',
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'bounce-in': 'bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55) forwards',
        'cart-pop': 'cartPop 0.3s ease-out',
      },
      keyframes: {
        bounceIn: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '50%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        cartPop: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)' },
        },
      }
    },
  },
  plugins: [],
}
