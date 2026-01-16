'use client';

/**
 * SlideWrapper Component
 * 
 * Wraps individual slides with proper styling, theme injection, and aspect ratio.
 * This is the container for each slide in the presentation.
 * 
 * Internal component - not exposed to Agent.
 */

import React, { type ReactNode, useEffect, useRef } from 'react';
import { useTheme, ThemedContainer } from './ThemeContext';
import type { ThemeName, VibeLevel } from '@/utils/types';

// =============================================================================
// Types
// =============================================================================

export interface SlideWrapperProps {
  children: ReactNode;
  /** Slide index (0-based) */
  index?: number;
  /** Theme override for this slide */
  theme?: ThemeName;
  /** Vibe override for this slide */
  vibe?: VibeLevel;
  /** Whether this slide is currently active */
  isActive?: boolean;
}

// =============================================================================
// Component
// =============================================================================

/**
 * SlideWrapper Component
 * 
 * Provides the slide container with proper aspect ratio (16:9) and theme injection.
 */
export function SlideWrapper({
  children,
  index = 0,
  theme,
  vibe,
  isActive = true,
}: SlideWrapperProps): JSX.Element {
  const { theme: currentTheme } = useTheme();
  
  // Determine effective theme
  const slideTheme = theme ?? currentTheme.name;
  
  // Base slide styles
  const slideStyles = {
    backgroundColor: 'var(--theme-bg)',
    color: 'var(--theme-text)',
  };
  
  // Hidden state for inactive slides
  const visibilityStyles = isActive
    ? {}
    : { display: 'none' };
  
  // If no theme override, render without nested provider
  if (!theme && !vibe) {
    return (
      <div
        className="slide"
        style={{ ...slideStyles, ...visibilityStyles }}
        data-slide-index={index}
        aria-hidden={!isActive}
        role="region"
        aria-label={`Slide ${index + 1}`}
      >
        {children}
      </div>
    );
  }
  
  // With theme/vibe override, wrap in ThemedContainer
  return (
    <ThemedContainer theme={theme} vibe={vibe} className="slide-themed-container">
      <div
        className="slide"
        style={{ ...slideStyles, ...visibilityStyles }}
        data-slide-index={index}
        data-theme={slideTheme}
        aria-hidden={!isActive}
        role="region"
        aria-label={`Slide ${index + 1}`}
      >
        {children}
      </div>
    </ThemedContainer>
  );
}

// =============================================================================
// Slide Container (Full Screen)
// =============================================================================

export interface SlideContainerProps {
  children: ReactNode;
  /** Current slide index */
  currentSlide?: number;
}

/**
 * SlideContainer Component
 * 
 * The outermost container that handles fullscreen presentation mode.
 * Calculates and applies proper scaling to fit slides within the viewport.
 */
export function SlideContainer({
  children,
  currentSlide = 0,
}: SlideContainerProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;
      
      // Calculate scale to fit viewport while maintaining 16:9 aspect ratio
      const scale = Math.min(
        window.innerWidth / 1920,
        window.innerHeight / 1080
      );
      
      // Apply scale directly to all .slide elements (inline style has highest priority)
      containerRef.current.querySelectorAll<HTMLElement>('.slide').forEach((slide) => {
        slide.style.transform = `scale(${scale})`;
      });
    };
    
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);
  
  return (
    <div 
      ref={containerRef}
      className="slide-container"
      data-current-slide={currentSlide}
      role="application"
      aria-label="Presentation"
    >
      {children}
    </div>
  );
}

// =============================================================================
// Exports
// =============================================================================

export default SlideWrapper;
