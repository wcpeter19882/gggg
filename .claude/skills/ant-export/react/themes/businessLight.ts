/**
 * Business Light Theme Definition
 * Professional light theme for executive presentations
 */

import type { ThemeDefinition } from './types';

export const businessLightTheme: ThemeDefinition = {
  name: 'businessLight',
  displayName: 'Business Light',
  isDark: false,
  colors: {
    bg: '#ffffff',
    surface: '#f8fafc',
    primary: '#1e3a5f',
    secondary: '#2563eb',
    accent: '#f59e0b',
    text: '#0f172a',
    textMuted: '#475569',
    border: '#e2e8f0',
    info: '#3b82f6',
    warning: '#f5a623',
    success: '#10b981',
    danger: '#ef4444',
  },
  typography: {
    fontDisplay: "'Segoe UI', system-ui, -apple-system, sans-serif",
    fontBody: "'Segoe UI', system-ui, -apple-system, sans-serif",
    fontMono: "'JetBrains Mono', ui-monospace, monospace",
    sizeDisplay: '96px',
    sizeHeading: '64px',
    sizeBody: '36px',
    sizeCaption: '32px',
    lineHeight: '1.3',
    letterSpacing: '-0.01em',
  },
  spacing: {
    gap: '2rem',
    padding: '3rem',
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
      sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
      md: '0 4px 12px rgba(0, 0, 0, 0.08)',
      lg: '0 8px 24px rgba(0, 0, 0, 0.12)',
      none: 'none',
    },
    borderWidth: '1px',
  },
};

export default businessLightTheme;
