/**
 * Base Theme Definition
 * 
 * Derived from globals.css and components.css defaults.
 * Acts as the fallback/root theme.
 */

import type { ThemeDefinition } from '@/utils/types';

export const baseTheme: ThemeDefinition = {
  name: 'base',
  displayName: 'Base Theme',
  colors: {
    bg: '#ffffff',
    surface: '#f1f5f9',
    primary: '#2563eb',
    secondary: '#7c3aed',
    accent: '#f59e0b',
    text: '#0f172a',
    textMuted: '#475569',
    border: '#e2e8f0',
    info: '#0ea5e9',
    warning: '#f59e0b',
    success: '#10b981',
    danger: '#ef4444',
  },
  typography: {
    fontDisplay: "'Inter', system-ui, -apple-system, sans-serif",
    fontBody: "'Inter', system-ui, -apple-system, sans-serif",
    fontMono: "'JetBrains Mono', ui-monospace, monospace",
    sizeDisplay: '80px',
    sizeHeading: '56px',
    sizeBody: '32px',
    sizeCaption: '24px',
    lineHeight: '1.5',
    letterSpacing: '-0.02em',
  },
  spacing: {
    gap: '36px',
    padding: '80px',
    margin: '32px',
  },
  visuals: {
    radius: {
      sm: '4px',
      md: '12px',
      lg: '16px',
      xl: '24px',
      full: '9999px',
    },
    shadow: {
      sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
      md: '0 4px 20px rgba(0, 0, 0, 0.08)',
      lg: '0 12px 40px rgba(0, 0, 0, 0.12)',
      none: 'none',
    },
    borderWidth: '1px',
  },
  components: {
    metricCard: {
      radius: '1rem',
      bg: 'var(--theme-surface)',
    }
  }
};

export default baseTheme;
