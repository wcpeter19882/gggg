'use client';

/**
 * SlideContext - Provides slide navigation state to child components
 * 
 * Used by the <Slide> component to determine visibility based on current slide index.
 */

import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

// =============================================================================
// Types
// =============================================================================

interface SlideContextValue {
  /** Current active slide index (0-based) */
  currentSlide: number;
  /** Total number of slides */
  totalSlides: number;
  /** Navigate to a specific slide */
  goToSlide: (index: number) => void;
  /** Go to next slide */
  nextSlide: () => void;
  /** Go to previous slide */
  prevSlide: () => void;
  /** Register a slide (called by Slide component on mount) */
  registerSlide: (index: number) => void;
}

// =============================================================================
// Context
// =============================================================================

const SlideContext = createContext<SlideContextValue | null>(null);

// =============================================================================
// Hook
// =============================================================================

export function useSlideContext(): SlideContextValue {
  const context = useContext(SlideContext);
  if (!context) {
    throw new Error('useSlideContext must be used within a SlideProvider');
  }
  return context;
}

// =============================================================================
// Provider
// =============================================================================

interface SlideProviderProps {
  children: ReactNode;
  /** Controlled current slide index (from parent) */
  currentSlide: number;
}

export function SlideProvider({ children, currentSlide }: SlideProviderProps): JSX.Element {
  const [totalSlides, setTotalSlides] = useState(0);

  const goToSlide = useCallback((index: number) => {
    // No-op in controlled mode - parent manages state
  }, []);

  const nextSlide = useCallback(() => {
    // No-op in controlled mode - parent manages state
  }, []);

  const prevSlide = useCallback(() => {
    // No-op in controlled mode - parent manages state
  }, []);

  const registerSlide = useCallback((index: number) => {
    setTotalSlides(prev => Math.max(prev, index + 1));
  }, []);

  const value: SlideContextValue = {
    currentSlide,
    totalSlides,
    goToSlide,
    nextSlide,
    prevSlide,
    registerSlide,
  };

  return (
    <SlideContext.Provider value={value}>
      {children}
    </SlideContext.Provider>
  );
}

// =============================================================================
// Slide Component (for use in MDX)
// =============================================================================

interface SlideProps {
  /** Slide index (0-based) */
  index: number;
  /** Slide content */
  children: ReactNode;
}

/**
 * Slide component - wraps individual slide content in MDX
 * 
 * Usage in MDX:
 * <Slide index={0}>
 *   <LayoutCover>...</LayoutCover>
 * </Slide>
 */
export function Slide({ index, children }: SlideProps): JSX.Element | null {
  const { currentSlide, registerSlide } = useSlideContext();

  // Register this slide on mount
  React.useEffect(() => {
    registerSlide(index);
  }, [index, registerSlide]);

  // Only render if this is the current slide
  const isActive = currentSlide === index;

  return (
    <div
      className="slide"
      data-slide-index={index}
      style={{
        display: isActive ? 'block' : 'none',
        width: '100%',
        height: '100%',
      }}
      aria-hidden={!isActive}
      role="region"
      aria-label={`Slide ${index + 1}`}
    >
      {children}
    </div>
  );
}
