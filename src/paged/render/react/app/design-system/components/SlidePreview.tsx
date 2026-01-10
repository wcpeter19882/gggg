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
 * - fillContainer mode: auto-scales to fill parent while maintaining 16:9
 */

import React, { useEffect, useRef, useState, type ReactNode } from 'react';
import { getTheme, themeToCSSVariables, vibeToCSSVariables } from '@/themes';
import type { ThemeName, VibeLevel } from '@/utils/types';

// =============================================================================
// Constants
// =============================================================================

const SLIDE_WIDTH = 1920;
const SLIDE_HEIGHT = 1080;
const ASPECT_RATIO = SLIDE_WIDTH / SLIDE_HEIGHT;

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
  /** Container max width in pixels (ignored if fillContainer is true) */
  maxWidth?: number;
  /** If true, auto-scale to fill parent container while maintaining 16:9 ratio */
  fillContainer?: boolean;
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
  fillContainer = false,
}: SlidePreviewProps): JSX.Element {
  const slideRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number } | null>(null);
  
  // Use ResizeObserver to track container size when fillContainer is true
  useEffect(() => {
    if (!fillContainer || !containerRef.current) return;
    
    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [fillContainer]);

  // Calculate scale and dimensions
  let computedWidth: number;
  let computedHeight: number;
  let computedScale: number;

  if (fillContainer && containerSize) {
    // Fill container width, height follows 16:9 ratio
    computedWidth = containerSize.width;
    computedScale = computedWidth / SLIDE_WIDTH;
    computedHeight = SLIDE_HEIGHT * computedScale;
  } else {
    // Fixed maxWidth mode
    computedWidth = maxWidth;
    computedScale = maxWidth / SLIDE_WIDTH;
    computedHeight = SLIDE_HEIGHT * computedScale;
  }

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
      ref={containerRef}
      className="slide-preview-container"
      style={{
        width: fillContainer ? '100%' : `${computedWidth}px`,
        height: fillContainer ? 'auto' : `${computedHeight}px`,
        overflow: 'visible',
        position: 'relative',
      }}
    >
      {/* Inner wrapper for the scaled slide */}
      <div
        style={{
          width: `${computedWidth}px`,
          height: `${computedHeight}px`,
          position: 'relative',
          borderRadius: '4px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
          overflow: 'hidden',
        }}
      >
        {/* The actual slide at 1920×1080, scaled down */}
        <div
          ref={slideRef}
          className={`slide-preview ${showBounds ? 'debug-bounds' : ''}`}
          style={{
            width: `${SLIDE_WIDTH}px`,
            height: `${SLIDE_HEIGHT}px`,
            transform: `scale(${computedScale})`,
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
