/**
 * Academic Theme Definition
 * 
 * A scholarly theme with serif typography and traditional academic aesthetics.
 * Ideal for educational content, research presentations, and formal lectures.
 */

import type { ThemeDefinition } from '@/utils/types';

export const academicTheme: ThemeDefinition = {
  name: 'academic',
  displayName: 'Academic',
  colors: {
    bg: '#fffef8',
    surface: '#faf8f0',
    primary: '#1a365d',
    secondary: '#2c5282',
    accent: '#c53030',
    text: '#1a202c',
    textMuted: '#4a5568',
    border: '#e2e8f0',
    info: '#2b6cb0',
    warning: '#c05621',
    success: '#276749',
    danger: '#c53030',
  },
  typography: {
    fontDisplay: "'Libre Baskerville', Georgia, serif",
    fontBody: "'Source Serif Pro', Georgia, serif",
    fontMono: "'IBM Plex Mono', ui-monospace, monospace",
    sizeDisplay: '3rem',
    sizeHeading: '1.875rem',
    sizeBody: '1.125rem',
    sizeCaption: '0.875rem',
    lineHeight: '1.8',
    letterSpacing: '0em',
  },
  spacing: {
    gap: '3rem',
    padding: '5rem',
    margin: '1.25rem',
  },
  visuals: {
    radius: '0.125rem',
    shadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
    borderWidth: '1px',
  },
};

export default academicTheme;
