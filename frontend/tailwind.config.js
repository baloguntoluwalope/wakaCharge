/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        green: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          400: '#34d572',
          500: '#1db954',
          600: '#16a34a',
          700: '#15803d',
        },
        navy: {
          50:  '#f0f4f8',
          100: '#d9e2ec',
          200: '#bcccdc',
          300: '#9fb3c8',
          400: '#829ab1',
          500: '#627d98',
          600: '#486581',
          700: '#334e68',
          800: '#243b53',
          850: '#1a2f45',
          900: '#102a43',
          950: '#060b12',
        },
        amber: {
          400: '#fbbf24',
          500: '#f59e0b',
        },
        sky: {
          400: '#38bdf8',
          500: '#0ea5e9',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'monospace'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '20px',
        '4xl': '24px',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px 0 rgba(0,0,0,0.08)',
        'card-dark': '0 1px 3px 0 rgba(0,0,0,0.3)',
        'glow-green': '0 0 24px rgba(29,185,84,0.25)',
        'glow-amber': '0 0 24px rgba(251,191,36,0.25)',
      },
      animation: {
        'charge': 'charge 1.4s ease-in-out infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'fade-up': 'fadeUp 0.4s ease forwards',
        'slide-in': 'slideIn 0.3s ease forwards',
      },
      keyframes: {
        charge: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(250%)' },
        },
        fadeUp: {
          '0%': { opacity: 0, transform: 'translateY(12px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: 0, transform: 'translateX(-12px)' },
          '100%': { opacity: 1, transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
}