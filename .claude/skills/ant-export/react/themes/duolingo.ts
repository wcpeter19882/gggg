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
  isDark: false,
  background: {
    color: 'linear-gradient(145deg, #ffffff 0%, #f0fdf4 60%, #dcfce7 100%)',
  },
  colors: {
    bg: '#ffffff',
    surface: '#f7f7f7',
    surfaceAlt: '#efefef',
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
    radius: '1rem',
    shadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
    borderWidth: '2px',
  },
};

export default duolingoTheme;
