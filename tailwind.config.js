/** @type {import("tailwindcss").Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0b0b0c",
        panel: "#111114",
        gold: {
          DEFAULT: "#D4AF37",
          highlight: "#FFD700",
          warm: "#ff9f1a",
          light: "#f6c15a",
          dim: "#a8862a",
        },
        text: {
          main: "#EAEAEA",
          muted: "#9A9A9A",
          dim: "#6f6f6f",
        },
        error: "#ff4d4f",
      },
      fontFamily: {
        sans: ["Montserrat", "sans-serif"],
        serif: ["Playfair Display", "serif"],
      },
      boxShadow: {
        "gold-glow": "0 0 18px rgba(212, 175, 55, 0.35)",
        "gold-glow-hover": "0 0 32px rgba(255, 215, 0, 0.55)",
        "gold-glow-sm": "0 0 8px rgba(212, 175, 55, 0.25)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.5s ease-out",
        "pulse-gold": "pulseGold 2s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        pulseGold: {
          "0%, 100%": { boxShadow: "0 0 15px rgba(212,175,55,0.3)" },
          "50%": { boxShadow: "0 0 35px rgba(212,175,55,0.7)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
}
