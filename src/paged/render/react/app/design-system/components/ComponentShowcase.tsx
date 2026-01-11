'use client';

/**
 * ComponentShowcase
 * 
 * A unified showcase component for displaying slide components in the design system.
 * Each showcase renders the component inside a scaled 1920×1080 slide with:
 * - Isolated theme (from ShowcaseContext)
 * - Optional layout wrapper for block components
 * - Collapsible bottom props panel
 * - Debug bounds toggle
 * 
 * Architecture:
 *   ComponentShowcase
 *     └── SlidePreview (scaled 1920×1080)
 *           └── Layout (optional wrapper)
 *                 └── Component
 */

import React, { useState, useCallback, type ReactNode } from 'react';
import { SlidePreview } from './SlidePreview';
import { PropControl, type PropConfig } from './PropControl';
import { useShowcase } from './ShowcaseContext';

// Default layout wrapper for block components
import { LayoutStacked } from '@/components/layouts/LayoutStacked';

// =============================================================================
// Types
// =============================================================================

type ComponentLevel = 'layout' | 'block' | 'atom';

export interface ComponentShowcaseProps {
  /** Display name */
  title: string;
  /** Brief description */
  description?: string;
  /** The component to showcase */
  component: React.ComponentType<any>;
  /** Default props for the component */
  defaultProps?: Record<string, any>;
  /** Prop configurations for the control panel */
  propConfigs?: PropConfig[];
  /** Children to pass to the component */
  children?: ReactNode;
  /** Component level: 'layout' renders directly, 'block'/'atom' wrapped in LayoutStacked */
  level?: ComponentLevel;
  /** Custom layout wrapper (overrides default LayoutStacked for blocks) */
  layoutWrapper?: React.ComponentType<{ children: ReactNode }>;
  /** Preview container max width */
  maxWidth?: number;
}

// =============================================================================
// Component
// =============================================================================

export function ComponentShowcase({
  title,
  description,
  component: Component,
  defaultProps = {},
  propConfigs = [],
  children,
  level = 'block',
  layoutWrapper: CustomLayout,
  maxWidth = 1280,
}: ComponentShowcaseProps): JSX.Element {
  const { theme, vibe, showBounds } = useShowcase();
  
  // Props state
  const [props, setProps] = useState(() => {
    const configDefaults = propConfigs.reduce((acc, config) => {
      if (config.defaultValue !== undefined) {
        acc[config.name] = config.defaultValue;
      }
      return acc;
    }, {} as Record<string, any>);
    return { ...configDefaults, ...defaultProps };
  });

  // Panel states - props expanded by default if there are props
  const [showCode, setShowCode] = useState(false);

  const handlePropChange = useCallback((name: string, value: any) => {
    setProps((prev) => ({ ...prev, [name]: value }));
  }, []);

  // Generate code snippet
  const codeSnippet = `<${Component.displayName || Component.name || 'Component'}
${Object.entries(props)
    .filter(([, value]) => value !== undefined && value !== '')
    .map(([key, value]) => `  ${key}={${JSON.stringify(value)}}`)
    .join('\n')}
${children ? '>\n  {children}\n</' + (Component.displayName || Component.name || 'Component') + '>' : '/>'}`;

  // Determine wrapper
  const LayoutWrapper = level === 'layout' 
    ? React.Fragment 
    : (CustomLayout || LayoutStacked);

  // Render the component with optional layout wrapper
  const renderContent = () => {
    const componentElement = (
      <Component {...props}>
        {children}
      </Component>
    );

    if (level === 'layout') {
      return componentElement;
    }

    // Wrap blocks/atoms in a layout
    return (
      <LayoutWrapper>
        {componentElement}
      </LayoutWrapper>
    );
  };

  return (
    <div className="showcase-container bg-white border border-neutral-200 rounded-lg overflow-hidden mb-8 shadow-sm">
      {/* Header */}
      <div className="showcase-header flex items-center justify-between px-4 py-3 bg-neutral-50 border-b border-neutral-200">
        <div>
          <h3 className="text-base font-semibold text-neutral-900">{title}</h3>
          {description && (
            <p className="text-sm text-neutral-500 mt-0.5">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-neutral-400">
            {theme} · {vibe}
          </span>
          <span className="text-xs px-2 py-0.5 bg-neutral-200 text-neutral-600 rounded">
            {level}
          </span>
        </div>
      </div>

      {/* Main content: Preview + Props side by side */}
      <div className="flex">
        {/* Slide Preview */}
        <div className="showcase-preview flex-1 flex items-center justify-center p-4 bg-neutral-100">
          <SlidePreview
            theme={theme}
            vibe={vibe}
            showBounds={showBounds}
            maxWidth={maxWidth}
          >
            {renderContent()}
          </SlidePreview>
        </div>

        {/* Props Panel - beside preview */}
        {propConfigs.length > 0 && (
          <div className="showcase-props w-72 border-l border-neutral-200 bg-white p-4 overflow-y-auto max-h-[540px]">
            <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">Properties</h4>
            <div className="space-y-1">
              {propConfigs.map((config) => (
                <PropControl
                  key={config.name}
                  config={config}
                  value={props[config.name]}
                  onChange={(val) => handlePropChange(config.name, val)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom toolbar */}
      <div className="showcase-toolbar flex items-center justify-between px-4 py-2 bg-neutral-50 border-t border-neutral-200">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCode(!showCode)}
            className={`text-xs px-3 py-1.5 rounded transition-colors ${
              showCode 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-neutral-200 text-neutral-600 hover:bg-neutral-300'
            }`}
          >
            {showCode ? '▼ Code' : '▶ Code'}
          </button>
        </div>
      </div>

      {/* Code Panel - at bottom */}
      {showCode && (
        <div className="showcase-code bg-neutral-900 px-4 py-3 overflow-x-auto border-t border-neutral-200">
          <pre className="text-xs text-neutral-100 font-mono whitespace-pre-wrap">
            {codeSnippet}
          </pre>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Exports
// =============================================================================

export default ComponentShowcase;
export type { PropConfig };
