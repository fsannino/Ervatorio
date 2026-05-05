import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        ink:      '#1A1A2E',
        academic: '#0F3460',
        gold:     '#C9A84C',
        paper:    '#F5F0E8',
        chalk:    '#FAFAF7',
        accent:   '#E63946',
        forest:   '#2D6A4F',
        rule:     '#D4C9B0',
        footnote: '#6B6560',
      },
      fontFamily: {
        display: ['var(--font-playfair)', 'Georgia', 'serif'],
        subhead: ['var(--font-spectral)', 'Georgia', 'serif'],
        body:    ['var(--font-source-serif)', 'Georgia', 'serif'],
        ui:      ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        mono:    ['var(--font-jetbrains)', 'monospace'],
      },
      maxWidth: {
        content: '720px',
        site:    '1200px',
        sidebar: '280px',
      },
      borderRadius: {
        DEFAULT: '4px',
      },
      boxShadow: {
        card: '4px 4px 0px rgba(26,26,46,0.08)',
      },
    },
  },
  plugins: [],
};

export default config;
