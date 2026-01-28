'use client';

/**
 * ThemeSelector Component
 * 
 * A floating UI component for switching themes in the slide viewer.
 * 
 * Features:
 * - Theme selection dropdown
 * - Collapsible panel to minimize distraction
 * - Keyboard shortcut (Shift+T) to toggle visibility
 */

import React, { useState, useEffect, useCallback } from 'react';

// =============================================================================
// Constants
// =============================================================================

/** Available themes with display names */
const THEMES = [
  { value: 'businessLight', label: 'Business Light', description: 'Professional light theme' },
  { value: 'business', label: 'Business', description: 'Professional corporate style' },
  { value: 'cyber', label: 'Cyber', description: 'Futuristic tech aesthetic' },
  { value: 'minimal', label: 'Minimal', description: 'Clean, typography-focused' },
  { value: 'academic', label: 'Academic', description: 'Scholarly presentation' },
  { value: 'creative', label: 'Creative', description: 'Bold artistic design' },
  { value: 'duolingo', label: 'Duolingo', description: 'Playful, friendly style' },
  { value: 'dark', label: 'Dark', description: 'Dark mode presentation' },
  { value: 'teamsDark', label: 'Teams Dark', description: 'Microsoft Teams dark mode' },
  { value: 'teamsLight', label: 'Teams Light', description: 'Microsoft Teams light mode' },
  { value: 'base', label: 'Base', description: 'Default clean theme' },
];

// =============================================================================
// Component
// =============================================================================

export interface ThemeSelectorProps {
  /** Current theme name */
  themeName: string;
  /** Callback to change theme */
  onThemeChange: (theme: string) => void;
  /** Initial collapsed state */
  defaultCollapsed?: boolean;
  /** Position on screen */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

/**
 * ThemeSelector Component
 * 
 * Floating panel for theme selection.
 */
export function ThemeSelector({
  themeName,
  onThemeChange,
  defaultCollapsed = true,
  position = 'bottom-right',
}: ThemeSelectorProps): JSX.Element {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [isVisible, setIsVisible] = useState(true);

  // Position styles
  const positionStyles: Record<string, React.CSSProperties> = {
    'top-left': { top: '1rem', left: '1rem' },
    'top-right': { top: '1rem', right: '1rem' },
    'bottom-left': { bottom: '4rem', left: '1rem' },
    'bottom-right': { bottom: '4rem', right: '1rem' },
  };

  // Handle keyboard shortcut (Shift+T to toggle)
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.shiftKey && e.key === 'T') {
      setIsVisible(prev => !prev);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!isVisible) {
    return (
      <div
        style={{
          position: 'fixed',
          ...positionStyles[position],
          zIndex: 9999,
        }}
      >
        <button
          onClick={() => setIsVisible(true)}
          style={{
            padding: '0.5rem',
            borderRadius: '0.5rem',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.75rem',
          }}
          title="Show theme selector (Shift+T)"
        >
          🎨
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        ...positionStyles[position],
        zIndex: 9999,
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderRadius: '0.75rem',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        color: 'white',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '0.875rem',
        minWidth: isCollapsed ? 'auto' : '260px',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.75rem 1rem',
          borderBottom: isCollapsed ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <span style={{ fontWeight: 600 }}>
          🎨 {isCollapsed ? themeName : 'Theme Selector'}
        </span>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{
              padding: '0.25rem 0.5rem',
              borderRadius: '0.25rem',
              backgroundColor: 'transparent',
              color: 'rgba(255, 255, 255, 0.7)',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.75rem',
            }}
            title={isCollapsed ? 'Expand' : 'Collapse'}
          >
            {isCollapsed ? '▼' : '▲'}
          </button>
          <button
            onClick={() => setIsVisible(false)}
            style={{
              padding: '0.25rem 0.5rem',
              borderRadius: '0.25rem',
              backgroundColor: 'transparent',
              color: 'rgba(255, 255, 255, 0.7)',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.75rem',
            }}
            title="Hide (Shift+T to show)"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Content - shown when expanded */}
      {!isCollapsed && (
        <div style={{ padding: '1rem' }}>
          {/* Theme Selection */}
          <div style={{ marginBottom: '1rem' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: 500,
                color: 'rgba(255, 255, 255, 0.9)',
              }}
            >
              Theme
            </label>
            <select
              value={themeName}
              onChange={(e) => onThemeChange(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '0.375rem',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              {THEMES.map((theme) => (
                <option key={theme.value} value={theme.value} style={{ backgroundColor: '#1e293b' }}>
                  {theme.label}
                </option>
              ))}
            </select>
            <p
              style={{
                marginTop: '0.25rem',
                fontSize: '0.75rem',
                color: 'rgba(255, 255, 255, 0.5)',
              }}
            >
              {THEMES.find(t => t.value === themeName)?.description}
            </p>
          </div>

          {/* Shortcut hint */}
          <p
            style={{
              marginTop: '1rem',
              paddingTop: '0.75rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              fontSize: '0.625rem',
              color: 'rgba(255, 255, 255, 0.4)',
              textAlign: 'center',
            }}
          >
            Press <kbd style={{ 
              padding: '0.125rem 0.25rem', 
              backgroundColor: 'rgba(255,255,255,0.1)', 
              borderRadius: '0.125rem' 
            }}>Shift+T</kbd> to toggle
          </p>
        </div>
      )}
    </div>
  );
}

export default ThemeSelector;
