import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#2563EB',
        primaryDark: '#1D4ED8',
        blueBg: '#EFF6FF',
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
