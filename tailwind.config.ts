import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#30D5C8',
          50: '#F0FDFA',
          100: '#E0FCF8',
          200: '#B2F5EE',
          300: '#84EFE4',
          400: '#56E9DA',
          500: '#30D5C8',
          600: '#2BBDB2',
          700: '#27ABA1',
          800: '#1F8A81',
          900: '#16625C',
        },
        primaryDark: '#2BBDB2',
        primaryBg: '#F0FDFA',
        borderGray: '#E5E7EB',
        textMain: '#0F172A',
        muted: '#475569'
      },
      borderRadius: {
        card: '16px',
        hero: '24px'
      },
      boxShadow: {
        soft: '0 10px 30px rgba(15, 23, 42, 0.07)',
        card: '0 6px 20px rgba(15, 23, 42, 0.06)'
      }
    }
  },
  plugins: []
} satisfies Config;
