/**
 * Heading Component (L3 Atom)
 * 
 * Semantic heading component for titles and section headers.
 * Renders appropriate HTML heading element (h1-h6) based on level prop.
 * 
 * Usage:
 * ```mdx
 * <Heading level={1}>Main Title</Heading>
 * <Heading level={2}>Section Title</Heading>
 * ```
 */

import React, { type ReactNode } from 'react';
import type { HeadingLevel } from '@/utils/types';

// =============================================================================
// Types
// =============================================================================

export interface HeadingProps {
  children: ReactNode;
  /** Heading level (1-6) */
  level?: HeadingLevel;
}

// =============================================================================
// Component
// =============================================================================

/**
 * Heading Component
 * 
 * Renders a semantic heading element with theme-aware styling.
 * 
 * @param level - Heading level (1-6), defaults to 1
 * @param children - Heading text content
 */
export function Heading({
  children,
  level = 1,
}: HeadingProps): JSX.Element {
  // Map level to class name
  const className = `heading-${level}`;
  
  // Render appropriate heading element
  switch (level) {
    case 1:
      return <h1 className={className}>{children}</h1>;
    case 2:
      return <h2 className={className}>{children}</h2>;
    case 3:
      return <h3 className={className}>{children}</h3>;
    case 4:
      return <h4 className={className}>{children}</h4>;
    case 5:
      return <h5 className={className}>{children}</h5>;
    case 6:
      return <h6 className={className}>{children}</h6>;
    default:
      return <h1 className="heading-1">{children}</h1>;
  }
}

// =============================================================================
// Exports
// =============================================================================

export default Heading;
