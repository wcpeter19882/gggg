/**
 * Business Theme Definition
 * 
 * Teams Dark theme - dark mode with purple/blue accent colors.
 * Optimized for Microsoft Teams style presentations.
 */

import type { ThemeDefinition } from '@/utils/types';

export const teamsDarkTheme: ThemeDefinition = {
  name: 'teamsDark',
  displayName: 'Teams Dark',
  isDark: true,
  background: {
    color: 'linear-gradient(135deg, #0f0e14 0%, #1d1c29 50%, #28273a 100%)',
  },
  colors: {
    bg: '#0f0e14',
    surface: '#1d1c29',
    surfaceAlt: '#28273a',
    primary: '#7f85f5',
    secondary: '#4f52b2',
    accent: '#339cff',
    text: '#ffffff',
    textMuted: '#c5c6d0',
    border: '#2e2e42',
    info: '#5bc0be',
    warning: '#ffc107',
    success: '#3dd68c',
    danger: '#ff4f4f',
  },
  typography: {
    fontDisplay: "'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    fontBody: "'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    fontMono: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    sizeDisplay: '59px',
    sizeHeading: '47px',
    sizeBody: '34px',
    sizeCaption: '27px',
    lineHeight: '1.3',
    letterSpacing: '-0.01em',
  },
  spacing: {
    gap: '3rem',
    padding: '4rem',
    margin: '1rem',
  },
  visuals: {
    radius: {
      sm: '2px',
      md: '6px',
      lg: '10px',
      xl: '14px',
      full: '9999px',
    },
    shadow: {
      sm: '0 1px 3px rgba(0, 0, 0, 0.35)',
      md: '0 4px 10px rgba(0, 0, 0, 0.45)',
      lg: '0 14px 28px rgba(0, 0, 0, 0.5)',
      none: 'none',
    },
    borderWidth: '1px',
  },
  components: {
    metricCard: {
      radius: '0.5rem',
    },
    heading: {
      gradient: 'linear-gradient(90deg, #9f93ff 0%, #6a63d9 50%, #26306a 100%)',
    }
  }
};

export default teamsDarkTheme;
