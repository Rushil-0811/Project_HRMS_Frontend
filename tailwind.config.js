/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary — deep slate-indigo, not the typical blue
        primary: {
          50:  '#f0f1ff',
          100: '#e4e5ff',
          200: '#ccceff',
          300: '#a9acff',
          400: '#817fff',
          500: '#5b52f5',
          600: '#4a3de8',
          700: '#3d2fd0',
          800: '#3228aa',
          900: '#2c2687',
          950: '#1a1650',
        },
        // Accent — warm amber for active states / badges
        accent: {
          50:  '#fff9eb',
          100: '#ffefc7',
          200: '#ffdc89',
          300: '#ffc34d',
          400: '#ffaa24',
          500: '#f98b07',
          600: '#dd6502',
          700: '#b74506',
          800: '#943510',
          900: '#7a2c11',
        },
        // Surface greys — cool, not warm
        surface: {
          0:   '#ffffff',
          50:  '#f7f8fc',
          100: '#eef0f6',
          200: '#dde1ee',
          300: '#c4c9dc',
          400: '#9aa0bc',
          500: '#6b738f',
          600: '#4e5570',
          700: '#363c55',
          800: '#232840',
          900: '#14172b',
        },
        // Semantic
        success: '#16a34a',
        warning: '#d97706',
        danger:  '#dc2626',
        info:    '#0891b2',
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.65rem', { lineHeight: '1rem' }],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        'card':  '0 1px 3px 0 rgb(20 23 43 / 0.08), 0 1px 2px -1px rgb(20 23 43 / 0.06)',
        'card-md': '0 4px 12px 0 rgb(20 23 43 / 0.10), 0 2px 4px -1px rgb(20 23 43 / 0.06)',
        'sidebar': '1px 0 0 0 #dde1ee',
      },
      animation: {
        'fade-in':    'fadeIn 0.18s ease-out',
        'slide-down': 'slideDown 0.2s ease-out',
      },
      keyframes: {
        fadeIn:    { from: { opacity: 0 }, to: { opacity: 1 } },
        slideDown: { from: { opacity: 0, transform: 'translateY(-6px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}
