'use client';

/**
 * Dynamic Slides Page for Project ID
 * 
 * URL: /slides/{projectId}
 * Loads slides from $CONTENT_MANAGER_PATH/{projectId}/content.json
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote';
import { mdxComponents } from '@/components/core/MDXProvider';
import { SlideContainer, SlideWrapper, SlideNavigation } from '@/components/core';
import { useTheme } from '@/components/core/ThemeContext';
import { ThemeSelector } from '@/components/core/ThemeSelector';
import type { ThemeName } from '@/utils/types';

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
  projectId: string;
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

export default function ProjectSlidesPage(): JSX.Element {
  const params = useParams();
  const projectId = params.projectId as string;
  
  const [slides, setSlides] = useState<SlideContent[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get theme setter from context to apply theme from content.json
  const { setTheme } = useTheme();

  // Load pre-serialized slides from API
  useEffect(() => {
    async function loadSlides() {
      if (!projectId) {
        setError('No project ID specified');
        setLoading(false);
        return;
      }
      
      try {
        // Load from API endpoint that returns pre-serialized MDX
        const response = await fetch(`/api/slides/project/${projectId}`);
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

        console.log(`Loaded ${data.slides.length} slides for project: ${projectId} (theme: ${data.theme})`);
        setSlides(data.slides);
        
        // Apply theme from content.json
        const validThemes: ThemeName[] = ['business', 'cyber', 'minimal', 'academic', 'creative', 'duolingo', 'dark'];
        if (data.theme && validThemes.includes(data.theme as ThemeName)) {
          setTheme(data.theme as ThemeName);
          console.log(`Applied theme: ${data.theme}`);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Failed to load slides:', err);
        setError(err instanceof Error ? err.message : 'Failed to load slides');
        setLoading(false);
      }
    }

    loadSlides();
  }, [projectId, setTheme]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === ' ') {
      e.preventDefault();
      setCurrentSlide(prev => Math.min(prev + 1, slides.length - 1));
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setCurrentSlide(prev => Math.max(prev - 1, 0));
    }
  }, [slides.length]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-white text-xl">Loading slides for {projectId}...</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900">
        <div className="text-red-500 text-xl mb-4">Error: {error}</div>
        <div className="text-gray-400 text-sm mb-2">
          Project ID: {projectId}
        </div>
        <div className="text-gray-500 text-xs">
          Make sure content.json exists in the project folder
        </div>
      </div>
    );
  }

  // No slides
  if (slides.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-yellow-500 text-xl">No slides to display</div>
      </div>
    );
  }

  return (
    <SlideContainer currentSlide={currentSlide}>
      {slides.map((slide, index) => (
        <SlideRenderer
          key={`slide-${slide.slideNumber}-${index}`}
          slide={slide}
          isActive={index === currentSlide}
          index={index}
        />
      ))}
      
      <SlideNavigation
        currentSlide={currentSlide}
        totalSlides={slides.length}
        onSlideChange={setCurrentSlide}
      />
      
      {/* Theme selector - toggle with Shift+T to override theme */}
      <ThemeSelector />
    </SlideContainer>
  );
}
