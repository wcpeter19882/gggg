/**
 * Teams Light Theme Definition
 * 
 * Teams Light theme - light mode with purple/blue accent colors.
 * Optimized for Microsoft Teams style presentations.
 */

import type { ThemeDefinition } from '@/utils/types';

export const teamsLightTheme: ThemeDefinition = {
  name: 'teamsLight',
  displayName: 'Teams Light',
  colors: {
    bg: '#ffffff',
    surface: '#f5f5f5',
    primary: '#6a63d9',
    secondary: '#338fe6',
    accent: '#4fb3ff',
    text: '#242424',
    textMuted: '#616161',
    border: '#e0e0e0',
    info: '#3aa7c9',
    warning: '#f7b900',
    success: '#107c10',
    danger: '#d13438',
  },
  typography: {
    fontDisplay: "'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    fontBody: "'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    fontMono: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    sizeDisplay: '3.25rem',
    sizeHeading: '1.9rem',
    sizeBody: '1.0625rem',
    sizeCaption: '0.875rem',
    lineHeight: '1.6',
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
      sm: '0 1px 2px rgba(0, 0, 0, 0.1)',
      md: '0 2px 8px rgba(0, 0, 0, 0.15)',
      lg: '0 8px 16px rgba(0, 0, 0, 0.2)',
      none: 'none',
    },
    borderWidth: '1px',
  },
  components: {
    metricCard: {
      radius: '0.5rem',
    },
    heading: {
      gradient: 'linear-gradient(90deg, #6a63d9 0%, #7ac8ff 100%',
    }
  }
};

export default teamsLightTheme;
