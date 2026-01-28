/**
 * Vibe System
 * 
 * Implements vibe modifiers that adjust visual intensity across all components.
 * Vibes modify theme values to create different visual intensities from
 * minimal (clean, no decorations) to expressive (maximum visual impact).
 * 
 * The vibe system works by:
 * 1. Defining modifier values for each vibe level
 * 2. Generating CSS custom properties that override theme defaults
 * 3. Components use these CSS variables for their styling
 * 
 * @module themes/vibes
 */

import type { VibeLevel } from '@/utils/types';

// =============================================================================
// Vibe Configuration Types
// =============================================================================

/**
 * Configuration values for each vibe level
 * These multipliers and values control visual intensity
 */
export interface VibeConfig {
  /** Overall intensity multiplier (0-2) */
  intensity: number;
  /** Shadow opacity multiplier */
  shadowOpacity: number;
  /** Border opacity multiplier */
  borderOpacity: number;
  /** Border width multiplier */
  borderWidthMultiplier: number;
  /** Border radius multiplier */
  radiusMultiplier: number;
  /** Accent color intensity */
  accentIntensity: number;
  /** Animation duration multiplier */
  animationMultiplier: number;
  /** Decoration visibility (0 = none, 1 = full) */
  decorationOpacity: number;
  /** Gradient intensity */
  gradientIntensity: number;
  /** Letter spacing modifier */
  letterSpacingModifier: string;
  /** Heading scale multiplier */
  headingScaleMultiplier: number;
}

// =============================================================================
// Vibe Definitions
// =============================================================================

/**
 * Vibe configurations for each level
 * Each vibe defines how visual elements should be modified
 */
export const vibeConfigs: Record<VibeLevel, VibeConfig> = {
  /**
   * Minimal (0) - Clean, no decorations
   * Focus on content, remove visual noise
   */
  minimal: {
    intensity: 0,
    shadowOpacity: 0,
    borderOpacity: 0.2,
    borderWidthMultiplier: 0.5,
    radiusMultiplier: 0,
    accentIntensity: 0.3,
    animationMultiplier: 0,
    decorationOpacity: 0,
    gradientIntensity: 0,
    letterSpacingModifier: '0em',
    headingScaleMultiplier: 0.95,
  },

  /**
   * Clean (1) - Subtle accents
   * Light styling, minimal shadows
   */
  clean: {
    intensity: 0.5,
    shadowOpacity: 0.3,
    borderOpacity: 0.4,
    borderWidthMultiplier: 0.75,
    radiusMultiplier: 0.5,
    accentIntensity: 0.5,
    animationMultiplier: 0.5,
    decorationOpacity: 0.2,
    gradientIntensity: 0.2,
    letterSpacingModifier: '-0.005em',
    headingScaleMultiplier: 1,
  },

  /**
   * Balanced (2) - Default, moderate styling
   * Standard visual presentation
   */
  balanced: {
    intensity: 1,
    shadowOpacity: 1,
    borderOpacity: 1,
    borderWidthMultiplier: 1,
    radiusMultiplier: 1,
    accentIntensity: 1,
    animationMultiplier: 1,
    decorationOpacity: 0.5,
    gradientIntensity: 0.5,
    letterSpacingModifier: '-0.01em',
    headingScaleMultiplier: 1,
  },

  /**
   * Decorative (3) - Rich visual elements
   * Enhanced shadows, borders, and accents
   */
  decorative: {
    intensity: 1.5,
    shadowOpacity: 1.5,
    borderOpacity: 1.5,
    borderWidthMultiplier: 1.5,
    radiusMultiplier: 1.25,
    accentIntensity: 1.3,
    animationMultiplier: 1.2,
    decorationOpacity: 0.8,
    gradientIntensity: 0.7,
    letterSpacingModifier: '-0.015em',
    headingScaleMultiplier: 1.05,
  },

  /**
   * Expressive (4) - Maximum visual impact
   * Bold styling, prominent decorations
   */
  expressive: {
    intensity: 2,
    shadowOpacity: 2,
    borderOpacity: 2,
    borderWidthMultiplier: 2,
    radiusMultiplier: 1.5,
    accentIntensity: 1.5,
    animationMultiplier: 1.5,
    decorationOpacity: 1,
    gradientIntensity: 1,
    letterSpacingModifier: '-0.02em',
    headingScaleMultiplier: 1.1,
  },
};

// =============================================================================
// Vibe CSS Variable Generation
// =============================================================================

/**
 * Generate CSS custom properties for a vibe level
 * These override theme defaults to adjust visual intensity
 */
export function vibeToCSSVariables(vibe: VibeLevel): Record<string, string> {
  const config = vibeConfigs[vibe];
  
  return {
    // Intensity modifiers
    '--vibe-intensity': String(config.intensity),
    '--vibe-shadow-opacity': String(config.shadowOpacity),
    '--vibe-border-opacity': String(config.borderOpacity),
    '--vibe-border-width-multiplier': String(config.borderWidthMultiplier),
    '--vibe-radius-multiplier': String(config.radiusMultiplier),
    '--vibe-accent-intensity': String(config.accentIntensity),
    '--vibe-animation-multiplier': String(config.animationMultiplier),
    '--vibe-decoration-opacity': String(config.decorationOpacity),
    '--vibe-gradient-intensity': String(config.gradientIntensity),
    '--vibe-letter-spacing': config.letterSpacingModifier,
    '--vibe-heading-scale': String(config.headingScaleMultiplier),
    
    // Computed values using calc()
    '--vibe-shadow': `0 ${1 * config.shadowOpacity}px ${3 * config.shadowOpacity}px rgba(0, 0, 0, ${0.1 * config.shadowOpacity})`,
    '--vibe-shadow-lg': `0 ${4 * config.shadowOpacity}px ${12 * config.shadowOpacity}px rgba(0, 0, 0, ${0.15 * config.shadowOpacity})`,
    '--vibe-radius': `calc(var(--theme-radius) * ${config.radiusMultiplier})`,
    '--vibe-border-width': `calc(var(--theme-border-width) * ${config.borderWidthMultiplier})`,
    '--vibe-animation-duration': `calc(300ms * ${config.animationMultiplier})`,
  };
}

/**
 * Apply vibe CSS variables to an element
 */
export function applyVibeToElement(element: HTMLElement, vibe: VibeLevel): void {
  const variables = vibeToCSSVariables(vibe);
  Object.entries(variables).forEach(([key, value]) => {
    element.style.setProperty(key, value);
  });
  // Set data attribute for CSS selectors
  element.setAttribute('data-vibe', vibe);
}

/**
 * Apply vibe CSS variables to document root
 */
export function applyVibeToDocument(vibe: VibeLevel): void {
  if (typeof document !== 'undefined') {
    applyVibeToElement(document.documentElement, vibe);
  }
}

/**
 * Get vibe config for a specific level
 */
export function getVibeConfig(vibe: VibeLevel): VibeConfig {
  return vibeConfigs[vibe];
}

/**
 * Get numeric level for a vibe (useful for comparisons)
 */
export function getVibeLevel(vibe: VibeLevel): number {
  const levels: Record<VibeLevel, number> = {
    minimal: 0,
    clean: 1,
    balanced: 2,
    decorative: 3,
    expressive: 4,
  };
  return levels[vibe];
}

/**
 * Check if a vibe meets a minimum intensity threshold
 */
export function vibeAtLeast(current: VibeLevel, minimum: VibeLevel): boolean {
  return getVibeLevel(current) >= getVibeLevel(minimum);
}

/**
 * Check if a vibe is at or below a maximum intensity
 */
export function vibeAtMost(current: VibeLevel, maximum: VibeLevel): boolean {
  return getVibeLevel(current) <= getVibeLevel(maximum);
}

// =============================================================================
// Exports
// =============================================================================

export type { VibeLevel };
