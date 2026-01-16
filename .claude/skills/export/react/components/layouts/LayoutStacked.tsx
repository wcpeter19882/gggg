/**
 * LayoutStacked Component (L1 Layout)
 * 
 * Single-column layout for dense text content.
 * Content is distributed vertically across the page with explicit
 * header, body, and footer sections.
 * 
 * Usage:
 * ```mdx
 * <LayoutStacked>
 *   <Heading level={2}>Title</Heading>
 *   <Text>Paragraph 1...</Text>
 *   <SmartList items={[...]} />
 *   <Text>Paragraph 2...</Text>
 *   <Callout intent="info">Important note</Callout>
 * </LayoutStacked>
 * ```
 */

import React, { type ReactNode, Children } from 'react';
import type { ThemeName, VibeLevel } from '@/utils/types';

// =============================================================================
// Types
// =============================================================================

export interface LayoutStackedProps {
  children: ReactNode;
  /** Text alignment */
  align?: 'left' | 'center';
  /** Theme override */
  theme?: ThemeName;
  /** Vibe modifier */
  vibe?: VibeLevel;
}

// =============================================================================
// Main Component
// =============================================================================

/**
 * LayoutStacked Component
 * 
 * Renders a single-column layout with explicit header, body, and footer sections.
 * - Header: First child (typically a Heading)
 * - Body: Middle children (content), wrapped in content-body div
 * - Footer: Last child (typically a Callout)
 * 
 * @param children - Content elements (headings, text, lists, callouts)
 * @param align - Text alignment ('left' or 'center')
 * @param theme - Optional theme override
 * @param vibe - Optional vibe modifier
 */
export function LayoutStacked({
  children,
  align = 'center',
  theme,
  vibe,
}: LayoutStackedProps): JSX.Element {
  const alignClass = align === 'center' ? 'align-center' : 'align-left';
  
  // Convert children to array
  const childArray = Children.toArray(children);
  
  // Always split into header (first), body (middle), footer (last)
  if (childArray.length >= 3) {
    const header = childArray[0];
    const body = childArray.slice(1, -1);
    const footer = childArray[childArray.length - 1];
    
    return (
      <div
        className={`layout-stacked ${alignClass}`}
        data-layout="stacked"
        data-align={align}
        data-theme={theme}
        data-vibe={vibe}
      >
        <div className="layout-header">
          {header}
        </div>
        <div className="content-body">
          {body}
        </div>
        <div className="layout-footer">
          {footer}
        </div>
      </div>
    );
  }
  
  // Fallback for fewer children: just wrap all in body
  return (
    <div
      className={`layout-stacked ${alignClass}`}
      data-layout="stacked"
      data-align={align}
      data-theme={theme}
      data-vibe={vibe}
    >
      <div className="content-body">
        {children}
      </div>
    </div>
  );
}

LayoutStacked.displayName = 'LayoutStacked';
