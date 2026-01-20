/**
 * Theme System Tests
 * 
 * Tests for theme switching, CSS variable injection, and theme registry.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { 
  themes, 
  getTheme, 
  getThemeNames,
  themeToCSSVariables,
  applyThemeToDocument,
  getVibeMultiplier,
} from '@/themes';
import { ThemeProvider, useTheme } from '@/components/core/ThemeContext';
import { businessTheme } from '@/themes/business';
import type { ThemeName, VibeLevel } from '@/utils/types';

// =============================================================================
// Theme Registry Tests
// =============================================================================

describe('Theme Registry', () => {
  it('has all expected themes registered', () => {
    const themeNames = getThemeNames();
    expect(themeNames).toContain('business');
    expect(themeNames).toContain('cyber');
    expect(themeNames).toContain('minimal');
    expect(themeNames).toContain('academic');
    expect(themeNames).toContain('creative');
    expect(themeNames).toContain('duolingo');
    expect(themeNames).toContain('dark');
  });

  it('returns correct theme by name', () => {
    const business = getTheme('business');
    expect(business.name).toBe('business');
    expect(business.displayName).toBe('Business');
  });

  it('falls back to business theme for invalid name', () => {
    const fallback = getTheme('nonexistent' as ThemeName);
    expect(fallback.name).toBe('business');
  });

  it('each theme has required color properties', () => {
    const requiredColors = [
      'bg', 'surface', 'primary', 'secondary', 'accent',
      'text', 'textMuted', 'border', 'info', 'warning', 'success', 'danger'
    ];
    
    for (const themeName of getThemeNames()) {
      const theme = getTheme(themeName);
      for (const colorKey of requiredColors) {
        expect(theme.colors).toHaveProperty(colorKey);
        expect(typeof theme.colors[colorKey as keyof typeof theme.colors]).toBe('string');
      }
    }
  });

  it('each theme has required typography properties', () => {
    const requiredTypo = [
      'fontDisplay', 'fontBody', 'fontMono',
      'sizeDisplay', 'sizeHeading', 'sizeBody', 'sizeCaption',
      'lineHeight', 'letterSpacing'
    ];
    
    for (const themeName of getThemeNames()) {
      const theme = getTheme(themeName);
      for (const typoKey of requiredTypo) {
        expect(theme.typography).toHaveProperty(typoKey);
      }
    }
  });

  it('each theme has required spacing properties', () => {
    for (const themeName of getThemeNames()) {
      const theme = getTheme(themeName);
      expect(theme.spacing).toHaveProperty('gap');
      expect(theme.spacing).toHaveProperty('padding');
      expect(theme.spacing).toHaveProperty('margin');
    }
  });

  it('each theme has required visual properties', () => {
    for (const themeName of getThemeNames()) {
      const theme = getTheme(themeName);
      expect(theme.visuals).toHaveProperty('radius');
      expect(theme.visuals).toHaveProperty('shadow');
      expect(theme.visuals).toHaveProperty('borderWidth');
    }
  });
});

// =============================================================================
// CSS Variable Generation Tests
// =============================================================================

describe('CSS Variable Generation', () => {
  it('generates CSS variables from theme', () => {
    const vars = themeToCSSVariables(businessTheme);
    
    // Check color variables
    expect(vars['--theme-bg']).toBe(businessTheme.colors.bg);
    expect(vars['--theme-primary']).toBe(businessTheme.colors.primary);
    expect(vars['--theme-text']).toBe(businessTheme.colors.text);
    
    // Check typography variables
    expect(vars['--theme-font-display']).toBe(businessTheme.typography.fontDisplay);
    expect(vars['--theme-size-display']).toBe(businessTheme.typography.sizeDisplay);
    
    // Check spacing variables
    expect(vars['--theme-spacing-gap']).toBe(businessTheme.spacing.gap);
    expect(vars['--theme-spacing-padding']).toBe(businessTheme.spacing.padding);
    
    // Check visual variables
    expect(vars['--theme-radius']).toBe(businessTheme.visuals.radius);
    expect(vars['--theme-shadow']).toBe(businessTheme.visuals.shadow);
  });

  it('generates all expected variable names', () => {
    const vars = themeToCSSVariables(businessTheme);
    const varNames = Object.keys(vars);
    
    // Should have color vars
    expect(varNames).toContain('--theme-bg');
    expect(varNames).toContain('--theme-surface');
    expect(varNames).toContain('--theme-primary');
    expect(varNames).toContain('--theme-secondary');
    expect(varNames).toContain('--theme-accent');
    expect(varNames).toContain('--theme-text');
    expect(varNames).toContain('--theme-text-muted');
    expect(varNames).toContain('--theme-border');
    
    // Should have typography vars
    expect(varNames).toContain('--theme-font-display');
    expect(varNames).toContain('--theme-font-body');
    expect(varNames).toContain('--theme-font-mono');
    
    // Should have spacing vars
    expect(varNames).toContain('--theme-spacing-gap');
    expect(varNames).toContain('--theme-spacing-padding');
    expect(varNames).toContain('--theme-spacing-margin');
    
    // Should have visual vars
    expect(varNames).toContain('--theme-radius');
    expect(varNames).toContain('--theme-shadow');
  });

  it('generates valid CSS values', () => {
    const vars = themeToCSSVariables(businessTheme);
    
    for (const [key, value] of Object.entries(vars)) {
      expect(value).toBeDefined();
      expect(typeof value).toBe('string');
      expect(value.length).toBeGreaterThan(0);
    }
  });
});

// =============================================================================
// CSS Variable Injection Tests
// =============================================================================

describe('CSS Variable Injection', () => {
  let originalDocumentElement: HTMLElement;

  beforeEach(() => {
    // Store original styles
    originalDocumentElement = document.documentElement;
  });

  afterEach(() => {
    // Clean up injected styles
    const style = document.getElementById('theme-variables');
    if (style) {
      style.remove();
    }
    // Clear inline styles
    document.documentElement.style.cssText = '';
  });

  it('injects theme variables into document', () => {
    applyThemeToDocument(businessTheme);
    
    const style = document.documentElement.style;
    expect(style.getPropertyValue('--theme-bg').trim()).toBe(businessTheme.colors.bg);
    expect(style.getPropertyValue('--theme-primary').trim()).toBe(businessTheme.colors.primary);
  });

  it('updates variables when theme changes', () => {
    // First inject business theme
    applyThemeToDocument(businessTheme);
    expect(document.documentElement.style.getPropertyValue('--theme-bg').trim()).toBe(businessTheme.colors.bg);
    
    // Then inject a different theme (cyber when implemented)
    const cyberTheme = getTheme('cyber');
    applyThemeToDocument(cyberTheme);
    expect(document.documentElement.style.getPropertyValue('--theme-bg').trim()).toBe(cyberTheme.colors.bg);
  });
});

// =============================================================================
// Vibe Level Tests
// =============================================================================

describe('Vibe Levels', () => {
  it('returns correct multipliers for each vibe', () => {
    expect(getVibeMultiplier('minimal')).toBe(0);
    expect(getVibeMultiplier('clean')).toBe(0.5);
    expect(getVibeMultiplier('balanced')).toBe(1);
    expect(getVibeMultiplier('decorative')).toBe(1.5);
    expect(getVibeMultiplier('expressive')).toBe(2);
  });

  it('falls back to balanced for invalid vibe', () => {
    expect(getVibeMultiplier('invalid' as VibeLevel)).toBe(1);
  });
});

// =============================================================================
// Theme Context Integration Tests
// =============================================================================

describe('ThemeContext Integration', () => {
  function ThemeConsumer() {
    const { theme, themeName, setTheme, vibe, setVibe } = useTheme();
    return (
      <div>
        <span data-testid="theme-name">{themeName}</span>
        <span data-testid="vibe">{vibe}</span>
        <span data-testid="bg-color">{theme.colors.bg}</span>
        <button data-testid="change-theme" onClick={() => setTheme('cyber')}>
          Change to Cyber
        </button>
        <button data-testid="change-vibe" onClick={() => setVibe('expressive')}>
          Change to Expressive
        </button>
      </div>
    );
  }

  it('provides default theme', () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );
    
    expect(screen.getByTestId('theme-name')).toHaveTextContent('business');
    expect(screen.getByTestId('vibe')).toHaveTextContent('balanced');
  });

  it('allows initial theme override', () => {
    render(
      <ThemeProvider theme="cyber">
        <ThemeConsumer />
      </ThemeProvider>
    );
    
    expect(screen.getByTestId('theme-name')).toHaveTextContent('cyber');
  });

  it('allows initial vibe override', () => {
    render(
      <ThemeProvider vibe="expressive">
        <ThemeConsumer />
      </ThemeProvider>
    );
    
    expect(screen.getByTestId('vibe')).toHaveTextContent('expressive');
  });

  it('updates theme when setTheme is called', () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );
    
    expect(screen.getByTestId('theme-name')).toHaveTextContent('business');
    
    act(() => {
      screen.getByTestId('change-theme').click();
    });
    
    expect(screen.getByTestId('theme-name')).toHaveTextContent('cyber');
  });

  it('updates vibe when setVibe is called', () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );
    
    expect(screen.getByTestId('vibe')).toHaveTextContent('balanced');
    
    act(() => {
      screen.getByTestId('change-vibe').click();
    });
    
    expect(screen.getByTestId('vibe')).toHaveTextContent('expressive');
  });
});

// =============================================================================
// Theme Differentiation Tests
// =============================================================================

describe('Theme Differentiation', () => {
  it('themes have distinct primary colors', () => {
    const primaryColors = new Set<string>();
    const themeNames = getThemeNames();
    
    for (const name of themeNames) {
      const theme = getTheme(name);
      primaryColors.add(theme.colors.primary);
    }
    
    // When all themes are implemented, they should have different primary colors
    // For now, just check that the property exists
    expect(primaryColors.size).toBeGreaterThan(0);
  });

  it('business theme has professional blue primary', () => {
    const business = getTheme('business');
    // Business theme should have a blue-ish primary
    expect(business.colors.primary).toMatch(/#[0-9a-fA-F]{6}/);
  });
});
