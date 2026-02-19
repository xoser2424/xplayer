/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0b0b0f", // Coal Black / Navy
        panel: "#121218",      // Panel Background
        gold: {
          DEFAULT: "#D4AF37",  // Main Gold
          highlight: "#FFD700", // Gold Highlight
        },
        text: {
          main: "#EAEAEA",     // Main Text
          muted: "#9A9A9A",    // Muted Text
          dim: "#6f6f6f",      // Dim Text
        },
        error: "#ff4d4f",      // Error Red
      },
      fontFamily: {
        sans: ['Montserrat', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
      boxShadow: {
        'gold-glow': '0 0 15px rgba(212, 175, 55, 0.3)',
        'gold-glow-hover': '0 0 25px rgba(255, 215, 0, 0.5)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}