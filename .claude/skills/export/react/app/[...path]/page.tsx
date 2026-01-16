'use client';

/**
 * Dynamic Slides Page - Routes /:path to output/:path/slides.mdx
 * 
 * Example: /golden_set_slides -> renders slides from output/golden_set_slides/slides.mdx
 * 
 * Uses SlideProvider context + <Slide index={N}> wrappers in MDX for navigation.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote';
import { mdxComponents } from '@/components/core/MDXProvider';
import { SlideContainer, SlideNavigation, SlideProvider } from '@/components/core';
import { ThemeSelector } from '@/components/core/ThemeSelector';

// =============================================================================
// Types
// =============================================================================

interface ApiResponse {
  source: MDXRemoteSerializeResult;
  slideCount: number;
  theme: string;
  sourcePath: string;
  path: string;
  error?: string;
  mdx?: string;
}

// =============================================================================
// Main Page Component
// =============================================================================

export default function DynamicSlidesPage(): JSX.Element {
  const params = useParams();
  const [mdxSource, setMdxSource] = useState<MDXRemoteSerializeResult | null>(null);
  const [slideCount, setSlideCount] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sourcePath, setSourcePath] = useState<string>('');

  // Build path from params
  const outputPath = Array.isArray(params.path) ? params.path.join('/') : params.path || '';

  // Load serialized MDX from API
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
        
        if (!data.source) {
          throw new Error('No MDX source in response');
        }

        console.log(`Loaded ${data.slideCount} slides from ${data.sourcePath}`);
        setMdxSource(data.source);
        setSlideCount(data.slideCount);
        setSourcePath(data.sourcePath);
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
    if (loading || slideCount === 0) return;
    
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
      case ' ':
      case 'PageDown':
        event.preventDefault();
        setCurrentSlide(prev => Math.min(prev + 1, slideCount - 1));
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
        setCurrentSlide(slideCount - 1);
        break;
    }
  }, [loading, slideCount]);

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
            Path: output/{outputPath}/slides.mdx
          </p>
        </div>
      </div>
    );
  }

  return (
    <SlideContainer currentSlide={currentSlide}>
      <SlideProvider currentSlide={currentSlide}>
        {mdxSource && (
          <MDXRemote {...mdxSource} components={mdxComponents} />
        )}
      </SlideProvider>
      <SlideNavigation
        currentSlide={currentSlide}
        totalSlides={slideCount}
        onSlideChange={setCurrentSlide}
      />
      {/* Theme selector - toggle with Shift+T to override theme */}
      <ThemeSelector />
      {/* Source path indicator */}
      <div className="fixed bottom-2 left-2 text-xs text-slate-600 opacity-50 hover:opacity-100">
        {sourcePath}
      </div>
    </SlideContainer>
  );
}
