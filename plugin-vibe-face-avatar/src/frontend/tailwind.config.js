/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        quantum: {
          black: "#050505",
          dark: "#0A0A0A",
          gray: "#1A1A1A",
          yellow: "#FFD700",
          neon: "#FFFF00",
          accent: "#E5C100",
        },
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          'from': { boxShadow: '0 0 10px -10px #FFD700' },
          'to': { boxShadow: '0 0 20px 5px #FFD700' },
        },
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
  ],
}
