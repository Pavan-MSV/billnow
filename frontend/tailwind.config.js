/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        success: {
          50: '#ecfdf5',
          100: '#d1fae5',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        },
        /* Semantic theme tokens (driven by CSS variables) */
        bg: 'rgb(var(--bn-bg) / <alpha-value>)',
        surface: 'rgb(var(--bn-surface) / <alpha-value>)',
        elevated: 'rgb(var(--bn-elevated) / <alpha-value>)',
        line: 'rgb(var(--bn-line) / <alpha-value>)',
        ink: 'rgb(var(--bn-ink) / <alpha-value>)',
        subtle: 'rgb(var(--bn-subtle) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(15 23 42 / 0.04), 0 1px 3px 0 rgb(15 23 42 / 0.06)',
        'card-hover': '0 10px 30px -12px rgb(15 23 42 / 0.18)',
        pop: '0 12px 40px -12px rgb(15 23 42 / 0.28)',
      },
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.97)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'splash-logo': {
          '0%': { opacity: '0', transform: 'scale(0.90)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'splash-badge': {
          '0%': { opacity: '0', transform: 'scale(0.5)' },
          '60%': { opacity: '1', transform: 'scale(1.2)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'splash-text': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'splash-tagline': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'scale-in': 'scale-in 0.16s ease-out',
        'slide-up': 'slide-up 0.25s ease-out',
        shimmer: 'shimmer 1.6s infinite',
        'splash-logo': 'splash-logo 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'splash-badge': 'splash-badge 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.4s both',
        'splash-text': 'splash-text 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.6s both',
        'splash-tagline': 'splash-tagline 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.9s both',
      },
    },
  },
  plugins: [],
};
