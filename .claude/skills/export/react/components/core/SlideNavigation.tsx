'use client';

/**
 * SlideNavigation Component
 * 
 * Provides keyboard navigation and progress indicator for presentations.
 * Handles arrow keys, space, escape for slide navigation.
 */

import React, { useEffect, useCallback, useState } from 'react';

// =============================================================================
// Types
// =============================================================================

export interface SlideNavigationProps {
  /** Total number of slides */
  totalSlides: number;
  /** Current slide index (0-based) */
  currentSlide: number;
  /** Callback when slide changes */
  onSlideChange: (index: number) => void;
  /** Whether to show navigation UI */
  showUI?: boolean;
}

// =============================================================================
// Component
// =============================================================================

/**
 * SlideNavigation Component
 * 
 * Provides keyboard navigation and a visual progress indicator.
 * 
 * Keyboard shortcuts:
 * - ArrowRight / Space / Enter: Next slide
 * - ArrowLeft: Previous slide
 * - Home: First slide
 * - End: Last slide
 * - Escape: Exit fullscreen (if applicable)
 * - 1-9: Jump to slide 1-9
 */
export function SlideNavigation({
  totalSlides,
  currentSlide,
  onSlideChange,
  showUI = true,
}: SlideNavigationProps): JSX.Element | null {
  const [isVisible, setIsVisible] = useState(true);
  
  // Navigation handlers
  const goToNextSlide = useCallback(() => {
    if (currentSlide < totalSlides - 1) {
      onSlideChange(currentSlide + 1);
    }
  }, [currentSlide, totalSlides, onSlideChange]);
  
  const goToPrevSlide = useCallback(() => {
    if (currentSlide > 0) {
      onSlideChange(currentSlide - 1);
    }
  }, [currentSlide, onSlideChange]);
  
  const goToFirstSlide = useCallback(() => {
    onSlideChange(0);
  }, [onSlideChange]);
  
  const goToLastSlide = useCallback(() => {
    onSlideChange(totalSlides - 1);
  }, [totalSlides, onSlideChange]);
  
  const goToSlide = useCallback((index: number) => {
    if (index >= 0 && index < totalSlides) {
      onSlideChange(index);
    }
  }, [totalSlides, onSlideChange]);
  
  // Keyboard event handler
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Ignore if user is typing in an input
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return;
    }
    
    switch (event.key) {
      case 'ArrowRight':
      case ' ':
      case 'Enter':
        event.preventDefault();
        goToNextSlide();
        break;
        
      case 'ArrowLeft':
        event.preventDefault();
        goToPrevSlide();
        break;
        
      case 'ArrowUp':
        event.preventDefault();
        goToPrevSlide();
        break;
        
      case 'ArrowDown':
        event.preventDefault();
        goToNextSlide();
        break;
        
      case 'Home':
        event.preventDefault();
        goToFirstSlide();
        break;
        
      case 'End':
        event.preventDefault();
        goToLastSlide();
        break;
        
      case 'Escape':
        // Could exit fullscreen if implemented
        break;
        
      // Number keys 1-9 for quick navigation
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
      case '6':
      case '7':
      case '8':
      case '9':
        event.preventDefault();
        goToSlide(parseInt(event.key, 10) - 1);
        break;
        
      default:
        break;
    }
  }, [goToNextSlide, goToPrevSlide, goToFirstSlide, goToLastSlide, goToSlide]);
  
  // Register keyboard listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
  
  // Auto-hide navigation UI after inactivity
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const showNav = () => {
      setIsVisible(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setIsVisible(false), 3000);
    };
    
    window.addEventListener('mousemove', showNav);
    window.addEventListener('keydown', showNav);
    
    // Initial show
    showNav();
    
    return () => {
      window.removeEventListener('mousemove', showNav);
      window.removeEventListener('keydown', showNav);
      clearTimeout(timeout);
    };
  }, []);
  
  // Calculate progress
  const progress = totalSlides > 1 
    ? ((currentSlide + 1) / totalSlides) * 100 
    : 100;
  
  if (!showUI) {
    return null;
  }
  
  return (
    <nav 
      className="slide-navigation"
      style={{ opacity: isVisible ? 1 : 0, transition: 'opacity 0.3s' }}
      aria-label="Slide navigation"
    >
      {/* Previous button */}
      <button
        type="button"
        onClick={goToPrevSlide}
        disabled={currentSlide === 0}
        aria-label="Previous slide"
        className="nav-button"
        style={{
          background: 'none',
          border: 'none',
          padding: '0.5rem',
          cursor: currentSlide === 0 ? 'not-allowed' : 'pointer',
          opacity: currentSlide === 0 ? 0.5 : 1,
        }}
      >
        ←
      </button>
      
      {/* Slide counter */}
      <span className="slide-counter" aria-live="polite">
        {currentSlide + 1} / {totalSlides}
      </span>
      
      {/* Progress bar */}
      <div className="slide-progress" role="progressbar" aria-valuenow={progress}>
        <div 
          className="slide-progress-bar" 
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {/* Next button */}
      <button
        type="button"
        onClick={goToNextSlide}
        disabled={currentSlide === totalSlides - 1}
        aria-label="Next slide"
        className="nav-button"
        style={{
          background: 'none',
          border: 'none',
          padding: '0.5rem',
          cursor: currentSlide === totalSlides - 1 ? 'not-allowed' : 'pointer',
          opacity: currentSlide === totalSlides - 1 ? 0.5 : 1,
        }}
      >
        →
      </button>
    </nav>
  );
}

// =============================================================================
// Hook for slide state management
// =============================================================================

export interface UseSlideNavigationOptions {
  totalSlides: number;
  initialSlide?: number;
}

export interface UseSlideNavigationResult {
  currentSlide: number;
  setCurrentSlide: (index: number) => void;
  nextSlide: () => void;
  prevSlide: () => void;
  isFirst: boolean;
  isLast: boolean;
}

/**
 * Hook for managing slide navigation state
 */
export function useSlideNavigation({
  totalSlides,
  initialSlide = 0,
}: UseSlideNavigationOptions): UseSlideNavigationResult {
  const [currentSlide, setCurrentSlide] = useState(initialSlide);
  
  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => Math.min(prev + 1, totalSlides - 1));
  }, [totalSlides]);
  
  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => Math.max(prev - 1, 0));
  }, []);
  
  return {
    currentSlide,
    setCurrentSlide,
    nextSlide,
    prevSlide,
    isFirst: currentSlide === 0,
    isLast: currentSlide === totalSlides - 1,
  };
}

// =============================================================================
// Exports
// =============================================================================

export default SlideNavigation;
