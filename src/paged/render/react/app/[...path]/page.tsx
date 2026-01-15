'use client';

/**
 * Dynamic Slides Page - Routes /:path to output/:path/state.json
 * 
 * Example: /golden_set_mdx -> renders slides from output/golden_set_mdx/state.json
 * Generated components are loaded from state.json at runtime.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote';
import { mdxComponents } from '@/components/core/MDXProvider';
import { SlideContainer, SlideWrapper, SlideNavigation } from '@/components/core';
import { useTheme } from '@/components/core/ThemeContext';
import { transform } from 'sucrase';
import * as FramerMotion from 'framer-motion';
import * as Lucide from 'lucide-react';
import type { ThemeDefinition, ThemeName, ThemeColors, ThemeTypography, ThemeSpacing, ThemeVisuals } from '@/utils/types';

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
  customTheme?: any;
  path: string;
  generatedComponents?: Record<string, GeneratedComponent>;
  error?: string;
}

// =============================================================================
// Theme Adapter
// =============================================================================

/** Adapt a generated (Python/JSON) theme to the React ThemeDefinition structure */
function adaptCustomTheme(generated: any): ThemeDefinition | null {
  if (!generated?.id) return null;

  // Validate theme has required nested structure
  const requiredFields = ['colors', 'typography', 'spacing', 'visuals'];
  for (const field of requiredFields) {
    if (!generated[field] || typeof generated[field] !== 'object') {
      throw new Error(
        `Invalid theme format: theme '${generated.id}' is missing '${field}' object. ` +
        `Expected nested structure: { colors: {...}, typography: {...}, spacing: {...}, visuals: {...} }. ` +
        `Theme may need to be regenerated with updated backend.`
      );
    }
  }

  return {
    name: (generated.name || generated.id) as ThemeName,
    displayName: generated.displayName || generated.name || generated.id,
    colors: {
      bg: generated.colors.bg || '#ffffff',
      surface: generated.colors.surface || '#f8fafc',
      primary: generated.colors.primary || '#2563eb',
      secondary: generated.colors.secondary || '#64748b',
      accent: generated.colors.accent || '#f59e0b',
      text: generated.colors.text || '#0f172a',
      textMuted: generated.colors.textMuted || '#475569',
      border: generated.colors.border || '#e2e8f0',
      info: generated.colors.info || '#0ea5e9',
      warning: generated.colors.warning || '#f59e0b',
      success: generated.colors.success || '#10b981',
      danger: generated.colors.danger || '#ef4444',
    },
    typography: {
      fontDisplay: generated.typography.fontDisplay || 'sans-serif',
      fontBody: generated.typography.fontBody || 'sans-serif',
      fontMono: generated.typography.fontMono || 'monospace',
      sizeDisplay: generated.typography.sizeDisplay || '60px',
      sizeHeading: generated.typography.sizeHeading || '40px',
      sizeBody: generated.typography.sizeBody || '18px',
      sizeCaption: generated.typography.sizeCaption || '14px',
      lineHeight: generated.typography.lineHeight || '1.5',
      letterSpacing: generated.typography.letterSpacing || '-0.02em',
    },
    spacing: {
      gap: generated.spacing.gap || '24px',
      padding: generated.spacing.padding || '32px',
      margin: generated.spacing.margin || '32px',
    },
    visuals: {
      radius: generated.visuals.radius || '8px',
      shadow: generated.visuals.shadow || '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      borderWidth: generated.visuals.borderWidth || '1px',
    },
  };
}

// =============================================================================
// Runtime Component Compiler
// =============================================================================

/**
 * Compile generated component code into React components at runtime.
 * Uses 'sucrase' to transpile TSX -> JS (CommonJS) and execute with new Function.
 */
function compileGeneratedComponents(
  generatedComponents: Record<string, GeneratedComponent>
): Record<string, React.ComponentType<any>> {
  const compiled: Record<string, React.ComponentType<any>> = {};
  
  for (const [id, comp] of Object.entries(generatedComponents)) {
    if (!comp.code || !comp.name) continue;
    
    try {
      const tsxCode = comp.code;
      
      // 1. Transpile TSX to CommonJS using sucrase
      // This handles:
      // - JSX -> React.createElement
      // - TypeScript types -> stripped
      // - import/export -> require/exports
      const { code: jsCode } = transform(tsxCode, {
        transforms: ['typescript', 'jsx', 'imports'],
      });
      
      // 2. Execute code in a CommonJS-like environment
      // We explicitly provide 'exports', 'require', and 'React'
      const componentFn = new Function('exports', 'require', 'React', jsCode);
      
      const exportsObj: Record<string, any> = {};
      
      // Minimal require shim to handle 'react' import
      const requireFn = (mod: string) => {
        if (mod === 'react') return React;
        if (mod === 'framer-motion') return FramerMotion;
        if (mod === 'lucide-react') return Lucide;
        throw new Error(`Cannot require module '${mod}' in generated component`);
      };
      
      // Execute
      componentFn(exportsObj, requireFn, React);
      
      // 3. Extract the exported component
      // The component should be a named export matching comp.name
      const Component = exportsObj[comp.name];
      
      if (Component) {
        compiled[comp.name] = Component;
        console.log(`[path] Compiled generated component: ${comp.name}`);
      } else {
        console.warn(`[path] Component '${comp.name}' not found in exports. Available:`, Object.keys(exportsObj));
      }
    } catch (err) {
      console.error(`[path] Failed to compile ${comp.name}:`, err);
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

export default function DynamicSlidesPage(): JSX.Element {
  const params = useParams();
  const [slides, setSlides] = useState<SlideContent[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sourcePath, setSourcePath] = useState<string>('');
  const [runtimeComponents, setRuntimeComponents] = useState<Record<string, React.ComponentType<any>>>({});

  // Get theme setter from context
  const { setTheme, setCustomTheme } = useTheme();

  // Merge base components with runtime-compiled generated components
  const allComponents = useMemo(() => ({
    ...mdxComponents,
    ...runtimeComponents,
  }), [runtimeComponents]);

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
        
        // Apply custom theme if available (Prioritize custom generated theme)
        if (data.customTheme) {
          const adapted = adaptCustomTheme(data.customTheme);
          if (adapted) {
            setCustomTheme(adapted);
            console.log(`[path] Applied custom generated theme: ${adapted.name}`);
          }
        } else {
          setCustomTheme(null);
        }

        // Apply theme from state.json (only if valid)
        const validThemes = ['business', 'cyber', 'minimal', 'academic', 'creative', 'duolingo', 'dark'];
        if (data.theme && validThemes.includes(data.theme)) {
          setTheme(data.theme as any);
          console.log(`[path] Applied theme: ${data.theme}`);
        }

        // Compile generated components from state.json at runtime
        if (data.generatedComponents && Object.keys(data.generatedComponents).length > 0) {
          console.log(`[path] Found ${Object.keys(data.generatedComponents).length} generated component(s)`);
          const compiled = compileGeneratedComponents(data.generatedComponents);
          setRuntimeComponents(compiled);
        }
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
    
    const { key } = event;
    const isNext = ['ArrowRight', 'ArrowDown', ' ', 'PageDown'].includes(key);
    const isPrev = ['ArrowLeft', 'ArrowUp', 'PageUp'].includes(key);
    
    if (isNext || isPrev || key === 'Home' || key === 'End') {
      event.preventDefault();
      
      if (isNext) setCurrentSlide(prev => Math.min(prev + 1, slides.length - 1));
      else if (isPrev) setCurrentSlide(prev => Math.max(prev - 1, 0));
      else if (key === 'Home') setCurrentSlide(0);
      else if (key === 'End') setCurrentSlide(slides.length - 1);
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
          components={allComponents}
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
