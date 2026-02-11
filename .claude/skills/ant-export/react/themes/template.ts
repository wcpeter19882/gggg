import type { ThemeDefinition } from './types';

export const templateTheme: ThemeDefinition = {
  name: 'template',
  displayName: 'Template',
  isDark: true,
  // Background settings - USE EXTRACTED VALUES
  background: {
    color: '#000000',
    image: 'images/cover___01_bg.png',
  },
  colors: {
    bg: '#000000',
    surface: '#0b3b45', // lifted from average_color #018399
    primary: '#38c0d6', // analogous lighter cyan from #018399
    secondary: '#f4af4b', // muted complementary amber
    accent: '#7bd9e7', // lightest analogous accent
    text: '#ffffff',
    textMuted: '#8fd1dd', // tinted neutral toward teal
    border: '#1d4e58',
    info: '#7dd3fc',
    warning: '#fed7aa',
    success: '#6ee7b7',
    danger: '#fca5a5',
  },
  typography: {
    fontDisplay: "'Aptos Display', system-ui, sans-serif",
    fontBody: "'Aptos', system-ui, sans-serif",
    fontMono: "'JetBrains Mono', ui-monospace, monospace",
    sizeDisplay: '59px',
    sizeHeading: '47px',
    sizeBody: '37px',
    sizeCaption: '27px',
    lineHeight: '1.3',
    letterSpacing: '-0.01em',
  },
  spacing: {
    gap: '2rem',
    padding: '4rem',
    margin: '1rem',
  },
  visuals: {
    radius: {
      sm: '4px',
      md: '8px',
      lg: '12px',
      xl: '16px',
      full: '9999px',
    },
    shadow: {
      sm: '0 2px 4px rgba(0, 0, 0, 0.3)',
      md: '0 4px 12px rgba(0, 0, 0, 0.4)',
      lg: '0 8px 24px rgba(0, 0, 0, 0.5)',
      none: 'none',
    },
    borderWidth: '1px',
  },
};

export default templateTheme;