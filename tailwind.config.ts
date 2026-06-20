import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        orange: {
          primary: '#EA580C',
          light:   '#FFF7ED',
          hover:   '#C2410C',
        },
        teal: {
          primary: '#0F766E',
          light:   '#F0FDFA',
          hover:   '#0D6B64',
        },
        sidebar: {
          bg:     '#0F1923',
          text:   '#94A3B8',
          active: '#EA580C',
        },
      },
      fontFamily: {
        sans:    ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
