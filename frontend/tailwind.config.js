/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6366f1',
          dark: '#4f46e5',
          light: '#818cf8'
        },
        secondary: '#ec4899',
        accent: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        dark: {
          DEFAULT: '#0f172a',
          card: '#1e293b',
          light: '#334155'
        }
      },
      fontFamily: {
        sans: ['Cairo', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
      }
    },
  },
  plugins: [],
}