/**
 * Cyber Theme Definition
 * 
 * A dark, futuristic theme with neon accents and tech aesthetics.
 * Inspired by cyberpunk aesthetics with electric blues and purples.
 */

import type { ThemeDefinition } from '@/utils/types';

export const cyberTheme: ThemeDefinition = {
  name: 'cyber',
  displayName: 'Cyber',
  colors: {
    bg: '#0a0a0f',
    surface: '#12121a',
    primary: '#00d4ff',
    secondary: '#7b2cbf',
    accent: '#ff006e',
    text: '#e0e0e0',
    textMuted: '#8a8a9a',
    border: '#2a2a3a',
    info: '#00d4ff',
    warning: '#ffd700',
    success: '#00ff88',
    danger: '#ff3366',
  },
  typography: {
    fontDisplay: "'Orbitron', 'Inter', system-ui, sans-serif",
    fontBody: "'Inter', system-ui, sans-serif",
    fontMono: "'JetBrains Mono', ui-monospace, monospace",
    sizeDisplay: '4rem',
    sizeHeading: '2.25rem',
    sizeBody: '1.125rem',
    sizeCaption: '0.875rem',
    lineHeight: '1.5',
    letterSpacing: '0.05em',
  },
  spacing: {
    gap: '2rem',
    padding: '2.5rem',
    margin: '1.5rem',
  },
  visuals: {
    radius: '0.25rem',
    shadow: '0 0 20px rgba(0, 212, 255, 0.3)',
    borderWidth: '1px',
  },
};

export default cyberTheme;
