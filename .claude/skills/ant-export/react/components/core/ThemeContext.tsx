'use client';

/**
 * ThemeContext - Provides slide theme to all components
 */

import React, { createContext, useContext, type ReactNode } from 'react';
import { type ThemeDefinition, getTheme } from '@/themes';

const ThemeContext = createContext<ThemeDefinition | null>(null);

export interface ThemeProviderProps {
  children: ReactNode;
  themeName?: string;
  theme?: ThemeDefinition;
}

export function ThemeProvider({ children, themeName = 'base', theme }: ThemeProviderProps) {
  const resolvedTheme = theme || getTheme(themeName);
  
  // Convert theme to CSS variables
  const cssVars: Record<string, string> = {
    '--theme-bg': resolvedTheme.colors.bg,
    '--theme-surface': resolvedTheme.colors.surface,
    '--theme-primary': resolvedTheme.colors.primary,
    '--theme-secondary': resolvedTheme.colors.secondary,
    '--theme-accent': resolvedTheme.colors.accent,
    '--theme-text': resolvedTheme.colors.text,
    '--theme-text-muted': resolvedTheme.colors.textMuted,
    '--theme-border': resolvedTheme.colors.border,
    '--theme-info': resolvedTheme.colors.info,
    '--theme-warning': resolvedTheme.colors.warning,
    '--theme-success': resolvedTheme.colors.success,
    '--theme-danger': resolvedTheme.colors.danger,
    '--theme-size-display': resolvedTheme.typography.sizeDisplay,
    '--theme-size-heading': resolvedTheme.typography.sizeHeading,
    '--theme-size-body': resolvedTheme.typography.sizeBody,
    '--theme-size-caption': resolvedTheme.typography.sizeCaption,
    '--theme-font-display': resolvedTheme.typography.fontDisplay,
    '--theme-font-body': resolvedTheme.typography.fontBody,
    '--theme-radius-sm': resolvedTheme.visuals.radius.sm,
    '--theme-radius-md': resolvedTheme.visuals.radius.md,
    '--theme-radius-lg': resolvedTheme.visuals.radius.lg,
  };
  
  return (
    <ThemeContext.Provider value={resolvedTheme}>
      <div style={cssVars as React.CSSProperties}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useSlideTheme(): ThemeDefinition {
  const theme = useContext(ThemeContext);
  if (!theme) {
    // Return base theme as fallback
    return getTheme('base');
  }
  return theme;
}

export default ThemeContext;
