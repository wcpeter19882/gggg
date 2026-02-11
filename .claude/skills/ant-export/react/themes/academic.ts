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
  isDark: false,
  background: {
    color: 'linear-gradient(160deg, #fffef8 0%, #faf8f0 50%, #f5f0e0 100%)',
  },
  colors: {
    bg: '#fffef8',
    surface: '#faf8f0',
    surfaceAlt: '#f5f3e8',
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
    sizeDisplay: '59px', // e.g., '59px' - from title style
    sizeHeading: '47px', // e.g., '47px'
    sizeBody: '34px', // e.g., '34px' - from body style
    sizeCaption: '27px', // e.g., '27px'
    lineHeight: '1.3',
    letterSpacing: '-0.01em'
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
