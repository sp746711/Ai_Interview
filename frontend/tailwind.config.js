/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#0a0a0a',
          800: '#141414',
          700: '#1e1e1e',
        },
        primary: {
          500: '#3b82f6',
          400: '#60a5fa',
        },
        neon: {
          blue: '#00f3ff',
          purple: '#bc13fe',
        },
        landing: {
          charcoal: '#0d0d0d',
          surface: '#161616',
          card: '#1a1a1a',
          peach: '#F3A080',
          'peach-muted': '#C4896E',
          bronze: '#9A8471',
          muted: '#8a8a8a',
        },
      },

      // 🔥 Add this for better UI
      backdropBlur: {
        xs: '2px',
      },

      boxShadow: {
        neon: '0 0 10px #00f3ff, 0 0 20px #bc13fe',
      },

      backgroundImage: {
        'neon-gradient':
          'linear-gradient(135deg, #00f3ff 0%, #bc13fe 100%)',
      },
    },
  },
  plugins: [],
}