/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        bg: 'var(--c-bg)',
        card: 'var(--c-card)',
        'card-soft': 'var(--c-card-soft)',
        primary: {
          DEFAULT: 'var(--c-primary)',
          light: 'var(--c-primary-light)',
          dark: 'var(--c-primary-dark)',
        },
        'primary-soft': 'var(--c-primary-soft)',
        mint: {
          DEFAULT: 'var(--c-green)',
          light: 'var(--c-green-light)',
        },
        warning: 'var(--c-warning)',
        warninglight: 'var(--c-warning-light)',
        danger: 'var(--c-danger)',
        dangerlight: 'var(--c-danger-light)',
        ink: {
          DEFAULT: 'var(--c-text)',
          secondary: 'var(--c-text-secondary)',
          muted: 'var(--c-text-muted)',
        },
        line: 'var(--c-border)',
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      boxShadow: {
        soft: '0 1px 2px 0 rgb(23 32 51 / 0.04), 0 4px 16px -2px rgb(23 32 51 / 0.06)',
        lift: '0 2px 4px 0 rgb(23 32 51 / 0.05), 0 12px 28px -6px rgb(23 32 51 / 0.10)',
        pop: '0 8px 24px -4px rgb(118 85 232 / 0.22)',
      },
      borderRadius: {
        xl2: '0.875rem',
      },
    },
  },
  plugins: [],
}
