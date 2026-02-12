import type { ThemeDefinition } from './types';

export const templateTheme: ThemeDefinition = {
  name: 'template',
  displayName: 'Template',
  isDark: true,
  // Background settings - USE EXTRACTED VALUES
  background: {
    color: '#000000',
    image: 'images/cover_01_bg.png',
  },
  colors: {
    bg: '#000000',
    // Lifted surface: derived from average_color (#3726ac) with +~15% luminance (cool indigo surface)
    surface: '#4A3EC5',
    // Accents derived for dark, saturated purple base:
    // primary (analogous, desaturated lavender, high luminance)
    primary: '#9575CD',
    // secondary (muted complementary soft-gold, desaturated to avoid vibration)
    secondary: '#FFE082',
    // accent (lightest analogous lavender)
    accent: '#B39DDB',
    // Text
    text: '#ffffff',
    // Muted text tinted toward base hue (lavender-gray, high luminance)
    textMuted: '#E6E0F3',
    // Border lifted from base hue (+~25% luminance), not too bright
    border: '#6A5AE0',
    // Semantic colors (pastel-tinted for dark/saturated bg; target ~70% luminance)
    info: '#93c5fd',
    warning: '#fcd34d',
    success: '#86efac',
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