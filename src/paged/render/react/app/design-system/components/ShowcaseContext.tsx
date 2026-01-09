'use client';

/**
 * ShowcaseContext
 * 
 * Global state for the design system page:
 * - Selected theme/vibe (applied to all ComponentShowcase instances)
 * - Debug mode (show layout bounds)
 * 
 * This is separate from the main ThemeContext to avoid polluting
 * the actual slide rendering system.
 */

import React, { createContext, useContext, useState, useMemo, type ReactNode } from 'react';
import type { ThemeName, VibeLevel } from '@/utils/types';

// =============================================================================
// Types
// =============================================================================

interface ShowcaseContextValue {
  /** Currently selected theme for showcases */
  theme: ThemeName;
  /** Currently selected vibe level */
  vibe: VibeLevel;
  /** Whether to show layout boundaries */
  showBounds: boolean;
  /** Update the theme */
  setTheme: (theme: ThemeName) => void;
  /** Update the vibe */
  setVibe: (vibe: VibeLevel) => void;
  /** Toggle bounds visibility */
  setShowBounds: (show: boolean) => void;
}

// =============================================================================
// Context
// =============================================================================

const ShowcaseContext = createContext<ShowcaseContextValue | undefined>(undefined);

// =============================================================================
// Hook
// =============================================================================

export function useShowcase(): ShowcaseContextValue {
  const context = useContext(ShowcaseContext);
  if (!context) {
    throw new Error('useShowcase must be used within ShowcaseProvider');
  }
  return context;
}

// =============================================================================
// Provider
// =============================================================================

interface ShowcaseProviderProps {
  children: ReactNode;
  defaultTheme?: ThemeName;
  defaultVibe?: VibeLevel;
}

export function ShowcaseProvider({
  children,
  defaultTheme = 'business',
  defaultVibe = 'balanced',
}: ShowcaseProviderProps): JSX.Element {
  const [theme, setTheme] = useState<ThemeName>(defaultTheme);
  const [vibe, setVibe] = useState<VibeLevel>(defaultVibe);
  const [showBounds, setShowBounds] = useState(false);

  const value = useMemo<ShowcaseContextValue>(
    () => ({
      theme,
      vibe,
      showBounds,
      setTheme,
      setVibe,
      setShowBounds,
    }),
    [theme, vibe, showBounds]
  );

  return (
    <ShowcaseContext.Provider value={value}>
      {children}
    </ShowcaseContext.Provider>
  );
}

// =============================================================================
// Theme/Vibe Options (for UI selectors)
// =============================================================================

export const THEME_OPTIONS: { value: ThemeName; label: string }[] = [
  { value: 'business', label: 'Business' },
  { value: 'cyber', label: 'Cyber' },
  { value: 'minimal', label: 'Minimal' },
  { value: 'academic', label: 'Academic' },
  { value: 'creative', label: 'Creative' },
  { value: 'duolingo', label: 'Duolingo' },
  { value: 'dark', label: 'Dark' },
];

export const VIBE_OPTIONS: { value: VibeLevel; label: string }[] = [
  { value: 'minimal', label: 'Minimal' },
  { value: 'clean', label: 'Clean' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'decorative', label: 'Decorative' },
  { value: 'expressive', label: 'Expressive' },
];
