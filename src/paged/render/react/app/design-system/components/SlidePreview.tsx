'use client';

/**
 * SlidePreview Component
 * 
 * Renders content inside a scaled 1920×1080 slide container with isolated theme.
 * The theme is applied via scoped CSS variables, not affecting the rest of the page.
 * 
 * Key features:
 * - Fixed 1920×1080 internal dimensions
 * - Scaled down to fit container (maintains aspect ratio)
 * - Isolated theme injection (CSS variables scoped to this element)
 * - Optional debug bounds overlay
 */

import React, { useEffect, useRef, type ReactNode } from 'react';
import { getTheme, themeToCSSVariables, vibeToCSSVariables } from '@/themes';
import type { ThemeName, VibeLevel } from '@/utils/types';

// =============================================================================
// Constants
// =============================================================================

const SLIDE_WIDTH = 1920;
const SLIDE_HEIGHT = 1080;

// =============================================================================
// Types
// =============================================================================

export interface SlidePreviewProps {
  children: ReactNode;
  /** Theme to apply */
  theme: ThemeName;
  /** Vibe level */
  vibe: VibeLevel;
  /** Show layout boundaries for debugging */
  showBounds?: boolean;
  /** Scale factor (default auto-calculated to fit container) */
  scale?: number;
  /** Container max width in pixels */
  maxWidth?: number;
}

// =============================================================================
// Component
// =============================================================================

export function SlidePreview({
  children,
  theme,
  vibe,
  showBounds = false,
  maxWidth = 800,
}: SlidePreviewProps): JSX.Element {
  const slideRef = useRef<HTMLDivElement>(null);
  
  // Calculate scale based on maxWidth
  const scale = maxWidth / SLIDE_WIDTH;
  const scaledHeight = SLIDE_HEIGHT * scale;

  // Apply CSS variables directly to the element when theme/vibe changes
  useEffect(() => {
    const element = slideRef.current;
    if (!element) return;
    
    const themeDefinition = getTheme(theme);
    const themeVars = themeToCSSVariables(themeDefinition);
    const vibeVars = vibeToCSSVariables(vibe);
    
    // Apply all CSS variables
    Object.entries({ ...themeVars, ...vibeVars }).forEach(([key, value]) => {
      element.style.setProperty(key, value);
    });
  }, [theme, vibe]);

  return (
    <div 
      className="slide-preview-container"
      style={{
        width: `${maxWidth}px`,
        height: `${scaledHeight}px`,
        overflow: 'hidden',
        position: 'relative',
        borderRadius: '4px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
      }}
    >
      {/* The actual slide at 1920×1080, scaled down */}
      <div
        ref={slideRef}
        className={`slide-preview ${showBounds ? 'debug-bounds' : ''}`}
        style={{
          width: `${SLIDE_WIDTH}px`,
          height: `${SLIDE_HEIGHT}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
        data-theme={theme}
        data-vibe={vibe}
      >
        {/* Slide inner content */}
        <div 
          className="slide-preview-content"
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: 'var(--theme-bg)',
            color: 'var(--theme-text)',
            fontFamily: 'var(--theme-font-body)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {children}
        </div>
      </div>

      {/* Debug bounds overlay - shows layout regions */}
      {showBounds && (
        <style>{`
          .slide-preview.debug-bounds [class*="layout-"],
          .slide-preview.debug-bounds [class*="Layout"] {
            outline: 2px dashed rgba(59, 130, 246, 0.5) !important;
            outline-offset: -2px;
            position: relative;
          }
          .slide-preview.debug-bounds [class*="layout-"]::before,
          .slide-preview.debug-bounds [class*="Layout"]::before {
            content: attr(class);
            position: absolute;
            top: 4px;
            left: 4px;
            font-size: 10px;
            font-family: monospace;
            background: rgba(59, 130, 246, 0.9);
            color: white;
            padding: 2px 6px;
            border-radius: 2px;
            z-index: 1000;
            pointer-events: none;
          }
          .slide-preview.debug-bounds .layout-slot,
          .slide-preview.debug-bounds [data-slot] {
            outline: 1px dashed rgba(16, 185, 129, 0.5) !important;
            outline-offset: -1px;
          }
        `}</style>
      )}
    </div>
  );
}

// =============================================================================
// Exports
// =============================================================================

export default SlidePreview;
