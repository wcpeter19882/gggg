/**
 * Minimal Theme Definition
 * 
 * A clean, minimal theme with maximum whitespace and subtle typography.
 * Perfect for content-focused presentations where the message takes center stage.
 */

import type { ThemeDefinition } from '@/utils/types';

export const minimalTheme: ThemeDefinition = {
  name: 'minimal',
  displayName: 'Minimal',
  colors: {
    bg: '#fafafa',
    surface: '#ffffff',
    primary: '#18181b',
    secondary: '#52525b',
    accent: '#a1a1aa',
    text: '#18181b',
    textMuted: '#71717a',
    border: '#e4e4e7',
    info: '#3b82f6',
    warning: '#f59e0b',
    success: '#22c55e',
    danger: '#ef4444',
  },
  typography: {
    fontDisplay: "'Inter', system-ui, sans-serif",
    fontBody: "'Inter', system-ui, sans-serif",
    fontMono: "'IBM Plex Mono', ui-monospace, monospace",
    sizeDisplay: '3rem',
    sizeHeading: '1.75rem',
    sizeBody: '1rem',
    sizeCaption: '0.75rem',
    lineHeight: '1.75',
    letterSpacing: '0em',
  },
  spacing: {
    gap: '4rem',
    padding: '6rem',
    margin: '1.5rem',
  },
  visuals: {
    radius: '0rem',
    shadow: 'none',
    borderWidth: '1px',
  },
};

export default minimalTheme;
