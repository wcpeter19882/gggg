'use client';

/**
 * Dynamic Slides Page
 * 
 * Renders MDX slides using pre-serialized content from API.
 * The API handles server-side MDX serialization.
 * Generated components are loaded from state.json at runtime.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote';
import { transform } from 'sucrase';
import * as FramerMotion from 'framer-motion';
import * as Lucide from 'lucide-react';
import { mdxComponents } from '@/components/core/MDXProvider';
import { SlideContainer, SlideWrapper, SlideNavigation } from '@/components/core';
import { useTheme } from '@/components/core/ThemeContext';
import { ThemeSelector } from '@/components/core/ThemeSelector';
import type { ThemeName } from '@/utils/types';

// =============================================================================
// Types
// =============================================================================

interface GeneratedComponent {
  name: string;
  code?: string;
  props_interface?: string;
}

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
  generatedComponents?: Record<string, GeneratedComponent>;
  error?: string;
}

// =============================================================================
// Runtime Component Compiler
// =============================================================================

/**
 * Compile generated component code into React components at runtime.
 * This allows components stored in state.json to be used without building.
 */
function compileGeneratedComponents(
  generatedComponents: Record<string, GeneratedComponent>
): Record<string, React.ComponentType<any>> {
  const compiled: Record<string, React.ComponentType<any>> = {};
  
  for (const [id, comp] of Object.entries(generatedComponents)) {
    if (!comp.code || !comp.name) continue;
    
    try {
      const tsxCode = comp.code;

      const { code: jsCode } = transform(tsxCode, {
        transforms: ['typescript', 'jsx', 'imports'],
      });

      const componentFn = new Function('exports', 'require', 'React', jsCode);
      const exportsObj: Record<string, any> = {};

      const requireFn = (mod: string) => {
        if (mod === 'react') return React;
        if (mod === 'framer-motion') return FramerMotion;
        if (mod === 'lucide-react') return Lucide;
        throw new Error(`Cannot require module '${mod}' in generated component`);
      };

      componentFn(exportsObj, requireFn, React);

      const Component = exportsObj[comp.name];
      if (Component) {
        compiled[comp.name] = Component;
        console.log(`[slides] Compiled generated component: ${comp.name}`);
      } else {
        console.warn(`[slides] Component '${comp.name}' not found in exports. Available:`, Object.keys(exportsObj));
      }
    } catch (err) {
      console.error(`[slides] Failed to compile ${comp.name}:`, err);
    }
  }
  
  return compiled;
}

// =============================================================================
// Components
// =============================================================================

interface SlideRendererProps {
  slide: SlideContent;
  isActive: boolean;
  index: number;
  components: Record<string, React.ComponentType<any>>;
}

function SlideRenderer({ slide, isActive, index, components }: SlideRendererProps): JSX.Element {
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
      <MDXRemote {...slide.source} components={components} />
    </SlideWrapper>
  );
}

// =============================================================================
// Main Page Component
// =============================================================================

export default function SlidesPage(): JSX.Element {
  const [slides, setSlides] = useState<SlideContent[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [outputPath, setOutputPath] = useState<string>('golden_set_mdx');
  
  // Get theme setter from context to apply theme from state.json
  const { setTheme } = useTheme();

  // Get path from URL query parameter - runs on mount and when URL changes
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pathParam = params.get('path') || 'golden_set_mdx';
    setOutputPath(pathParam);
    setLoading(true); // Reset loading state when path changes
  }, [typeof window !== 'undefined' ? window.location.search : '']);

  const [runtimeComponents, setRuntimeComponents] = useState<Record<string, React.ComponentType<any>>>({});
  // Merge base components with runtime-compiled generated components
  const allComponents = useMemo(() => ({
    ...mdxComponents,
    ...runtimeComponents,
  }), [runtimeComponents]);

  // Load pre-serialized slides from API
  useEffect(() => {
    async function loadSlides() {
      try {
        // Load from API endpoint that returns pre-serialized MDX
        const response = await fetch(`/api/slides/?path=${encodeURIComponent(outputPath)}`);
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

        console.log(`Loaded ${data.slides.length} slides from ${data.source} (path: ${outputPath}, theme: ${data.theme})`);
        setSlides(data.slides);
        
        // Apply theme from state.json (set by --mdx-theme CLI flag)
        const validThemes: ThemeName[] = ['business', 'cyber', 'minimal', 'academic', 'creative', 'duolingo', 'dark'];
        if (data.theme && validThemes.includes(data.theme as ThemeName)) {
          setTheme(data.theme as ThemeName);
          console.log(`Applied theme: ${data.theme}`);
        }

        // Compile generated components from state.json at runtime
        if (data.generatedComponents && Object.keys(data.generatedComponents).length > 0) {
          console.log(`[slides] Found ${Object.keys(data.generatedComponents).length} generated component(s)`);
          const compiled = compileGeneratedComponents(data.generatedComponents);
          console.log("Shiyi compiled generated components:", Object.keys(compiled));
          setRuntimeComponents(compiled);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Failed to load slides:', err);
        setError(err instanceof Error ? err.message : 'Failed to load slides');
        setLoading(false);
      }
    }

    loadSlides();
  }, [outputPath]);

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
        <div className="text-white text-xl">Loading slides...</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900">
        <div className="text-red-500 text-xl mb-4">Error: {error}</div>
        <div className="text-gray-400 text-sm">
          Make sure state.json exists in the output directory
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
          key={index}
          slide={slide}
          isActive={index === currentSlide}
          index={index}
          components={allComponents}
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
