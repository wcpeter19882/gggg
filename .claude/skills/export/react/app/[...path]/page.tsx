'use client';

/**
 * Dynamic Slides Page - Routes /:path to output/:path/state.json
 * 
 * Example: /golden_set_mdx -> renders slides from output/golden_set_mdx/state.json
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote';
import { mdxComponents } from '@/components/core/MDXProvider';
import { SlideContainer, SlideWrapper, SlideNavigation } from '@/components/core';

// =============================================================================
// Types
// =============================================================================

interface SlideContent {
  source: MDXRemoteSerializeResult | null;
  slideNumber: number;
  mdx?: string;
  error?: string;
}

interface ApiResponse {
  slides: SlideContent[];
  slideCount: number;
  source: string;
  theme: string;
  path: string;
  error?: string;
}

// =============================================================================
// Components
// =============================================================================

interface SlideRendererProps {
  slide: SlideContent;
  isActive: boolean;
  index: number;
}

function SlideRenderer({ slide, isActive, index }: SlideRendererProps): JSX.Element {
  if (slide.error || !slide.source) {
    return (
      <SlideWrapper index={index} isActive={isActive}>
        <div className="text-red-500 p-8">
          <h2 className="text-xl mb-4">Error rendering slide {slide.slideNumber}</h2>
          <pre className="text-sm bg-red-900/20 p-4 rounded">{slide.error || 'No source'}</pre>
          {slide.mdx && (
            <details className="mt-4">
              <summary>MDX Source</summary>
              <pre className="text-xs mt-2 overflow-auto max-h-48">{slide.mdx}</pre>
            </details>
          )}
        </div>
      </SlideWrapper>
    );
  }
  
  return (
    <SlideWrapper index={index} isActive={isActive}>
      <MDXRemote {...slide.source} components={mdxComponents} />
    </SlideWrapper>
  );
}

// =============================================================================
// Main Page Component
// =============================================================================

export default function DynamicSlidesPage(): JSX.Element {
  const params = useParams();
  const [slides, setSlides] = useState<SlideContent[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sourcePath, setSourcePath] = useState<string>('');

  // Build path from params
  const outputPath = Array.isArray(params.path) ? params.path.join('/') : params.path || '';

  // Load pre-serialized slides from API
  useEffect(() => {
    if (!outputPath) {
      setError('No path specified');
      setLoading(false);
      return;
    }

    async function loadSlides() {
      try {
        const response = await fetch(`/api/slides/${outputPath}`);
        if (!response.ok) {
          throw new Error(`Failed to load slides: ${response.statusText}`);
        }
        
        const data: ApiResponse = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        if (!data.slides || data.slides.length === 0) {
          throw new Error('No slides found in response');
        }

        console.log(`Loaded ${data.slides.length} slides from ${data.source}`);
        setSlides(data.slides);
        setSourcePath(data.source);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load slides:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    }

    loadSlides();
  }, [outputPath]);

  // Keyboard navigation
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (loading) return;
    
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
      case ' ':
      case 'PageDown':
        event.preventDefault();
        setCurrentSlide(prev => Math.min(prev + 1, slides.length - 1));
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
      case 'PageUp':
        event.preventDefault();
        setCurrentSlide(prev => Math.max(prev - 1, 0));
        break;
      case 'Home':
        event.preventDefault();
        setCurrentSlide(0);
        break;
      case 'End':
        event.preventDefault();
        setCurrentSlide(slides.length - 1);
        break;
    }
  }, [loading, slides.length]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading slides from {outputPath}...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center max-w-lg">
          <h1 className="text-2xl text-red-500 mb-4">Failed to Load Slides</h1>
          <p className="text-slate-400 mb-4">{error}</p>
          <p className="text-slate-500 text-sm">
            Path: output/{outputPath}/state.json
          </p>
        </div>
      </div>
    );
  }

  return (
    <SlideContainer
      currentSlide={currentSlide}
    >
      {slides.map((slide, index) => (
        <SlideRenderer
          key={index}
          slide={slide}
          index={index}
          isActive={index === currentSlide}
        />
      ))}
      <SlideNavigation
        currentSlide={currentSlide}
        totalSlides={slides.length}
        onSlideChange={setCurrentSlide}
      />
      {/* Source path indicator */}
      <div className="fixed bottom-2 left-2 text-xs text-slate-600 opacity-50 hover:opacity-100">
        {sourcePath}
      </div>
    </SlideContainer>
  );
}
