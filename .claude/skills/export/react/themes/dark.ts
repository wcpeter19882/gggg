/**
 * Dark Theme Definition
 * 
 * A modern dark theme with comfortable contrast and subtle depth.
 * Suitable for low-light environments and developer-focused content.
 */

import type { ThemeDefinition } from '@/utils/types';

export const darkTheme: ThemeDefinition = {
  name: 'dark',
  displayName: 'Dark',
  colors: {
    bg: '#121212',
    surface: '#1e1e1e',
    primary: '#bb86fc',
    secondary: '#03dac6',
    accent: '#cf6679',
    text: '#e1e1e1',
    textMuted: '#a0a0a0',
    border: '#333333',
    info: '#03dac6',
    warning: '#ffb74d',
    success: '#81c784',
    danger: '#cf6679',
  },
  typography: {
    fontDisplay: "'Inter', system-ui, sans-serif",
    fontBody: "'Inter', system-ui, sans-serif",
    fontMono: "'JetBrains Mono', ui-monospace, monospace",
    sizeDisplay: '3.5rem',
    sizeHeading: '2rem',
    sizeBody: '1.125rem',
    sizeCaption: '0.875rem',
    lineHeight: '1.6',
    letterSpacing: '-0.01em',
  },
  spacing: {
    gap: '1.5rem',
    padding: '2rem',
    margin: '1rem',
  },
  visuals: {
    radius: '0.5rem',
    shadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
    borderWidth: '1px',
  },
};

export default darkTheme;
