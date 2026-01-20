/**
 * Creative Theme Definition
 * 
 * A bold, expressive theme with vibrant colors and playful typography.
 * Perfect for creative pitches, design presentations, and artistic content.
 */

import type { ThemeDefinition } from '@/utils/types';

export const creativeTheme: ThemeDefinition = {
  name: 'creative',
  displayName: 'Creative',
  colors: {
    bg: '#fef3c7',
    surface: '#fffbeb',
    primary: '#7c3aed',
    secondary: '#ec4899',
    accent: '#f97316',
    text: '#1f2937',
    textMuted: '#6b7280',
    border: '#fcd34d',
    info: '#06b6d4',
    warning: '#f59e0b',
    success: '#10b981',
    danger: '#ef4444',
  },
  typography: {
    fontDisplay: "'Space Grotesk', system-ui, sans-serif",
    fontBody: "'DM Sans', system-ui, sans-serif",
    fontMono: "'Fira Code', ui-monospace, monospace",
    sizeDisplay: '4rem',
    sizeHeading: '2.5rem',
    sizeBody: '1.25rem',
    sizeCaption: '0.875rem',
    lineHeight: '1.5',
    letterSpacing: '-0.02em',
  },
  spacing: {
    gap: '4rem',
    padding: '5rem',
    margin: '1.5rem',
  },
  visuals: {
    radius: '1rem',
    shadow: '4px 4px 0px rgba(0, 0, 0, 0.15)',
    borderWidth: '3px',
  },
};

export default creativeTheme;
