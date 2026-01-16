/**
 * Duolingo Theme Definition
 * 
 * A friendly, educational theme inspired by language learning apps.
 * Features bright greens, rounded elements, and approachable typography.
 */

import type { ThemeDefinition } from '@/utils/types';

export const duolingoTheme: ThemeDefinition = {
  name: 'duolingo',
  displayName: 'Duolingo',
  colors: {
    bg: '#ffffff',
    surface: '#f7f7f7',
    primary: '#58cc02',
    secondary: '#1cb0f6',
    accent: '#ff9600',
    text: '#3c3c3c',
    textMuted: '#777777',
    border: '#e5e5e5',
    info: '#1cb0f6',
    warning: '#ff9600',
    success: '#58cc02',
    danger: '#ff4b4b',
  },
  typography: {
    fontDisplay: "'Nunito', 'Inter', system-ui, sans-serif",
    fontBody: "'Nunito', 'Inter', system-ui, sans-serif",
    fontMono: "'JetBrains Mono', ui-monospace, monospace",
    sizeDisplay: '3.5rem',
    sizeHeading: '2rem',
    sizeBody: '1.125rem',
    sizeCaption: '0.875rem',
    lineHeight: '1.6',
    letterSpacing: '0em',
  },
  spacing: {
    gap: '3rem',
    padding: '4rem',
    margin: '1rem',
  },
  visuals: {
    radius: '1rem',
    shadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
    borderWidth: '2px',
  },
};

export default duolingoTheme;
