'use client';

/**
 * ThemeContext Provider
 * 
 * Provides theme and vibe state to all child components.
 * Uses React Context to inject CSS variables and theme configuration.
 * 
 * Usage:
 * ```tsx
 * <ThemeProvider theme="business" vibe="balanced">
 *   <Presentation />
 * </ThemeProvider>
 * ```
 */

import React, { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react';
import type { ThemeContextValue, ThemeDefinition, ThemeName, VibeLevel } from '@/utils/types';
import { getTheme, applyThemeToDocument, applyVibeToDocument } from '@/themes';

// =============================================================================
// Context Definition
// =============================================================================

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook to access theme context
 * @throws Error if used outside ThemeProvider
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

/**
 * Hook to safely access theme context (returns undefined if not in provider)
 */
export function useThemeOptional(): ThemeContextValue | undefined {
  return useContext(ThemeContext);
}

// =============================================================================
// Provider Component
// =============================================================================

export interface ThemeProviderProps {
  children: ReactNode;
  /** Initial theme name */
  theme?: ThemeName;
  /** Initial vibe level */
  vibe?: VibeLevel;
}

/**
 * ThemeProvider Component
 * 
 * Wraps the application to provide theme context and inject CSS variables.
 */
export function ThemeProvider({
  children,
  theme: initialTheme = 'business',
  vibe: initialVibe = 'balanced',
}: ThemeProviderProps): JSX.Element {
  const [themeName, setThemeName] = useState<ThemeName>(initialTheme);
  const [vibe, setVibe] = useState<VibeLevel>(initialVibe);
  
  // Get the full theme definition
  const theme: ThemeDefinition = useMemo(() => getTheme(themeName), [themeName]);
  
  // Apply theme CSS variables to document
  useEffect(() => {
    applyThemeToDocument(theme);
    
    // Set data attribute for gradient heading support
    const hasGradient = !!theme.components?.heading?.gradient;
    document.documentElement.setAttribute('data-theme-gradient', String(hasGradient));
  }, [theme]);

  // Apply vibe CSS variables to document
  useEffect(() => {
    applyVibeToDocument(vibe);
  }, [vibe]);
  
  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<ThemeContextValue>(() => ({
    theme,
    themeName,
    vibe,
    setTheme: setThemeName,
    setVibe,
  }), [theme, themeName, vibe]);
  
  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

// =============================================================================
// Utility Components
// =============================================================================

export interface ThemedContainerProps {
  children: ReactNode;
  /** Theme override for this container */
  theme?: ThemeName;
  /** Vibe override for this container */
  vibe?: VibeLevel;
  /** Additional class name */
  className?: string;
}

/**
 * ThemedContainer Component
 * 
 * A container that can override the theme/vibe for its children.
 * Useful for per-slide theme overrides.
 */
export function ThemedContainer({
  children,
  theme: themeOverride,
  vibe: vibeOverride,
  className = '',
}: ThemedContainerProps): JSX.Element {
  const parentContext = useTheme();
  
  // Use overrides if provided, otherwise inherit from parent
  const theme = themeOverride ? getTheme(themeOverride) : parentContext.theme;
  const vibe = vibeOverride ?? parentContext.vibe;
  
  // Create local context with overrides
  const localContext = useMemo<ThemeContextValue>(() => ({
    theme,
    themeName: themeOverride ?? parentContext.themeName,
    vibe,
    setTheme: parentContext.setTheme,
    setVibe: parentContext.setVibe,
  }), [theme, themeOverride, parentContext.themeName, vibe, parentContext.setTheme, parentContext.setVibe]);
  
  return (
    <ThemeContext.Provider value={localContext}>
      <div className={className} data-theme={theme.name} data-vibe={vibe}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

// =============================================================================
// Exports
// =============================================================================

export { ThemeContext };
export default ThemeProvider;
