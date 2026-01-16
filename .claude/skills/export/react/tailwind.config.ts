import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Theme colors injected via CSS variables
        'theme-bg': 'var(--theme-bg)',
        'theme-surface': 'var(--theme-surface)',
        'theme-primary': 'var(--theme-primary)',
        'theme-secondary': 'var(--theme-secondary)',
        'theme-accent': 'var(--theme-accent)',
        'theme-text': 'var(--theme-text)',
        'theme-text-muted': 'var(--theme-text-muted)',
        'theme-border': 'var(--theme-border)',
      },
      fontFamily: {
        'theme-display': 'var(--theme-font-display)',
        'theme-body': 'var(--theme-font-body)',
        'theme-mono': 'var(--theme-font-mono)',
      },
      fontSize: {
        'theme-display': 'var(--theme-size-display)',
        'theme-heading': 'var(--theme-size-heading)',
        'theme-body': 'var(--theme-size-body)',
        'theme-caption': 'var(--theme-size-caption)',
      },
      spacing: {
        'theme-gap': 'var(--theme-spacing-gap)',
        'theme-padding': 'var(--theme-spacing-padding)',
        'theme-margin': 'var(--theme-spacing-margin)',
      },
      borderRadius: {
        'theme': 'var(--theme-radius)',
      },
      boxShadow: {
        'theme': 'var(--theme-shadow)',
      },
      aspectRatio: {
        'slide': '16 / 9',
      },
    },
  },
  plugins: [],
};

export default config;
