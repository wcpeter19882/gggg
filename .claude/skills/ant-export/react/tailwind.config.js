const { heroui } = require("@heroui/react");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Slide-specific spacing (based on 1280x720 slide)
      spacing: {
        'slide-xs': '8px',
        'slide-sm': '16px',
        'slide-md': '24px',
        'slide-lg': '32px',
        'slide-xl': '48px',
        'slide-2xl': '64px',
      },
      // Slide-specific sizes
      width: {
        'slide-full': '1280px',
        'slide-half': '640px',
        'slide-third': '426px',
        'slide-quarter': '320px',
      },
      height: {
        'slide-full': '720px',
        'slide-content': '600px',
        'slide-half': '360px',
      },
      // Font sizes for slides
      fontSize: {
        'slide-title': ['48px', { lineHeight: '1.2', fontWeight: '700' }],
        'slide-subtitle': ['32px', { lineHeight: '1.3', fontWeight: '600' }],
        'slide-heading': ['28px', { lineHeight: '1.3', fontWeight: '600' }],
        'slide-body': ['20px', { lineHeight: '1.5' }],
        'slide-caption': ['16px', { lineHeight: '1.4' }],
        'slide-small': ['14px', { lineHeight: '1.4' }],
      },
      // Animation for slide transitions
      animation: {
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  darkMode: "class",
  plugins: [heroui()],
}

