/**
 * Business Theme Definition
 * 
 * The default professional theme with clean lines and corporate colors.
 * Optimized for business presentations, reports, and professional contexts.
 */

import type { ThemeDefinition } from '@/utils/types';

export const businessTheme: ThemeDefinition = {
  name: 'business',
  displayName: 'Business',
  isDark: false,
  background: {
    color: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 60%, #e2e8f0 100%)',
  },
  colors: {
    bg: '#ffffff',
    surface: '#f8fafc',
    surfaceAlt: '#f1f5f9',
    primary: '#1e40af',
    secondary: '#3b82f6',
    accent: '#f59e0b',
    text: '#1e293b',
    textMuted: '#64748b',
    border: '#e2e8f0',
    info: '#0ea5e9',
    warning: '#f59e0b',
    success: '#22c55e',
    danger: '#ef4444',
  },
  typography: {
    fontDisplay: "'Inter', system-ui, sans-serif",
    fontBody: "'Inter', system-ui, sans-serif",
    fontMono: "'JetBrains Mono', ui-monospace, monospace",
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
      lg: '8px',
      xl: '12px',
      full: '9999px',
    },
    shadow: {
      sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
      md: '0 1px 3px rgba(0, 0, 0, 0.1)',
      lg: '0 4px 6px rgba(0, 0, 0, 0.1)',
      none: 'none',
    },
    borderWidth: '1px',
  },
  components: {
    metricCard: {
      radius: '0.5rem',
    }
  }
};

export default businessTheme;
