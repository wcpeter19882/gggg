/**
 * Theme Registry and CSS Variable Injection
 * 
 * This module manages theme definitions and provides utilities for
 * injecting theme CSS variables into the DOM.
 */

import type { ThemeDefinition, ThemeName, VibeLevel } from '@/utils/types';
import { baseTheme } from './base';
import { businessTheme } from './business';
import { cyberTheme } from './cyber';
import { minimalTheme } from './minimal';
import { academicTheme } from './academic';
import { creativeTheme } from './creative';
import { duolingoTheme } from './duolingo';
import { darkTheme } from './dark';
import { 
  vibeConfigs, 
  vibeToCSSVariables, 
  applyVibeToElement, 
  applyVibeToDocument,
  getVibeConfig,
  getVibeLevel,
  vibeAtLeast,
  vibeAtMost,
} from './vibes';

// =============================================================================
// Theme Registry
// =============================================================================

/** All available themes */
export const themes: Record<ThemeName, ThemeDefinition> = {
  base: baseTheme,
  business: businessTheme,
  cyber: cyberTheme,
  minimal: minimalTheme,
  academic: academicTheme,
  creative: creativeTheme,
  duolingo: duolingoTheme,
  dark: darkTheme,
};

/** Get a theme by name, with fallback to business */
export function getTheme(name: ThemeName): ThemeDefinition {
  return themes[name] || themes.business;
}

/** List all available theme names */
export function getThemeNames(): ThemeName[] {
  return Object.keys(themes) as ThemeName[];
}

// =============================================================================
// Vibe Modifiers
// =============================================================================

/** Vibe level multipliers for visual intensity */
export const vibeMultipliers: Record<VibeLevel, number> = {
  minimal: 0,
  clean: 0.5,
  balanced: 1,
  decorative: 1.5,
  expressive: 2,
};

/** Get vibe multiplier */
export function getVibeMultiplier(vibe: VibeLevel): number {
  return vibeMultipliers[vibe] ?? vibeMultipliers.balanced;
}

// =============================================================================
// CSS Variable Generation
// =============================================================================

/** Generate CSS custom properties from a theme definition */
export function themeToCSSVariables(theme: ThemeDefinition): Record<string, string> {
  const variables: Record<string, string> = {
    // Colors
    '--theme-bg': theme.colors.bg,
    '--theme-surface': theme.colors.surface,
    '--theme-primary': theme.colors.primary,
    '--theme-secondary': theme.colors.secondary,
    '--theme-accent': theme.colors.accent,
    '--theme-text': theme.colors.text,
    '--theme-text-muted': theme.colors.textMuted,
    '--theme-border': theme.colors.border,
    '--theme-info': theme.colors.info,
    '--theme-warning': theme.colors.warning,
    '--theme-success': theme.colors.success,
    '--theme-danger': theme.colors.danger,
    
    // Typography
    '--theme-font-display': theme.typography.fontDisplay,
    '--theme-font-body': theme.typography.fontBody,
    '--theme-font-mono': theme.typography.fontMono,
    '--theme-size-display': theme.typography.sizeDisplay,
    '--theme-size-heading': theme.typography.sizeHeading,
    '--theme-size-body': theme.typography.sizeBody,
    '--theme-size-caption': theme.typography.sizeCaption,
    '--theme-line-height': theme.typography.lineHeight,
    '--theme-letter-spacing': theme.typography.letterSpacing,
    
    // Spacing
    '--theme-spacing-gap': theme.spacing.gap,
    '--theme-spacing-padding': theme.spacing.padding,
    '--theme-spacing-margin': theme.spacing.margin,
    
    // Visuals
    '--theme-radius': typeof theme.visuals.radius === 'string' ? theme.visuals.radius : theme.visuals.radius.md,
    '--theme-radius-sm': typeof theme.visuals.radius === 'string' ? theme.visuals.radius : theme.visuals.radius.sm,
    '--theme-radius-md': typeof theme.visuals.radius === 'string' ? theme.visuals.radius : theme.visuals.radius.md,
    '--theme-radius-lg': typeof theme.visuals.radius === 'string' ? theme.visuals.radius : theme.visuals.radius.lg,
    '--theme-radius-xl': typeof theme.visuals.radius === 'string' ? theme.visuals.radius : (theme.visuals.radius.xl || theme.visuals.radius.lg),
    '--theme-radius-full': typeof theme.visuals.radius === 'string' ? '9999px' : (theme.visuals.radius.full || '9999px'),

    '--theme-shadow': typeof theme.visuals.shadow === 'string' ? theme.visuals.shadow : theme.visuals.shadow.md,
    '--theme-shadow-sm': typeof theme.visuals.shadow === 'string' ? theme.visuals.shadow : theme.visuals.shadow.sm,
    '--theme-shadow-md': typeof theme.visuals.shadow === 'string' ? theme.visuals.shadow : theme.visuals.shadow.md,
    '--theme-shadow-lg': typeof theme.visuals.shadow === 'string' ? theme.visuals.shadow : theme.visuals.shadow.lg,
    
    '--theme-border-width': theme.visuals.borderWidth,
  };

  // Component Overrides
  if (theme.components?.metricCard) {
    if (theme.components.metricCard.radius) {
      variables['--comp-metric-card-radius'] = theme.components.metricCard.radius;
    }
    if (theme.components.metricCard.bg) {
      variables['--comp-metric-card-bg'] = theme.components.metricCard.bg;
    }
  }

  return variables;
}

/** Convert CSS variables to inline style string */
export function cssVariablesToStyleString(variables: Record<string, string>): string {
  return Object.entries(variables)
    .map(([key, value]) => `${key}: ${value}`)
    .join('; ');
}

/** Apply theme CSS variables to an element */
export function applyThemeToElement(element: HTMLElement, theme: ThemeDefinition): void {
  const variables = themeToCSSVariables(theme);
  Object.entries(variables).forEach(([key, value]) => {
    element.style.setProperty(key, value);
  });
}

/** Apply theme CSS variables to document root */
export function applyThemeToDocument(theme: ThemeDefinition): void {
  if (typeof document !== 'undefined') {
    applyThemeToElement(document.documentElement, theme);
  }
}

// =============================================================================
// Exports
// =============================================================================

export { businessTheme } from './business';
export { cyberTheme } from './cyber';
export { minimalTheme } from './minimal';
export { academicTheme } from './academic';
export { creativeTheme } from './creative';
export { duolingoTheme } from './duolingo';
export { darkTheme } from './dark';
export { 
  vibeConfigs, 
  vibeToCSSVariables, 
  applyVibeToElement, 
  applyVibeToDocument,
  getVibeConfig,
  getVibeLevel,
  vibeAtLeast,
  vibeAtMost,
} from './vibes';
export type { VibeConfig } from './vibes';
export type { ThemeDefinition, ThemeName, VibeLevel };
