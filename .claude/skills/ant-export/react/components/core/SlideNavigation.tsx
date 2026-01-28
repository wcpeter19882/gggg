'use client';

/**
 * SlideNavigation - Keyboard and click navigation for slides
 */

import React, { useEffect, useCallback } from 'react';

export interface SlideNavigationProps {
  currentSlide: number;
  totalSlides: number;
  onNavigate: (slideNumber: number) => void;
}

export function SlideNavigation({ currentSlide, totalSlides, onNavigate }: SlideNavigationProps) {
  
  const goNext = useCallback(() => {
    if (currentSlide < totalSlides) {
      onNavigate(currentSlide + 1);
    }
  }, [currentSlide, totalSlides, onNavigate]);
  
  const goPrev = useCallback(() => {
    if (currentSlide > 1) {
      onNavigate(currentSlide - 1);
    }
  }, [currentSlide, onNavigate]);
  
  const goFirst = useCallback(() => {
    onNavigate(1);
  }, [onNavigate]);
  
  const goLast = useCallback(() => {
    onNavigate(totalSlides);
  }, [totalSlides, onNavigate]);
  
  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
        case ' ':
        case 'PageDown':
          e.preventDefault();
          goNext();
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
        case 'PageUp':
          e.preventDefault();
          goPrev();
          break;
        case 'Home':
          e.preventDefault();
          goFirst();
          break;
        case 'End':
          e.preventDefault();
          goLast();
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goNext, goPrev, goFirst, goLast]);
  
  return (
    <nav className="slide-navigation" aria-label="Slide navigation">
      <button 
        onClick={goPrev} 
        disabled={currentSlide <= 1}
        aria-label="Previous slide"
        className="nav-button nav-prev"
      >
        ←
      </button>
      <span className="nav-counter">
        {currentSlide} / {totalSlides}
      </span>
      <button 
        onClick={goNext} 
        disabled={currentSlide >= totalSlides}
        aria-label="Next slide"
        className="nav-button nav-next"
      >
        →
      </button>
    </nav>
  );
}

export default SlideNavigation;
