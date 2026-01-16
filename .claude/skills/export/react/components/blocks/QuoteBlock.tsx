/**
 * QuoteBlock Component (L2 Block)
 * 
 * Semantic block quote component for testimonials and citations.
 * Automatically styled based on current theme and vibe.
 * 
 * Usage:
 * ```mdx
 * <QuoteBlock 
 *   author="Steve Jobs"
 *   source="Stanford Commencement, 2005"
 * >
 *   Stay hungry, stay foolish.
 * </QuoteBlock>
 * ```
 */

import React, { type ReactNode } from 'react';
import type { Size } from '@/utils/types';

// =============================================================================
// Types
// =============================================================================

export interface QuoteBlockProps {
  /** Quote text content */
  children: ReactNode;
  /** Quote author */
  author?: string;
  /** Source or context */
  source?: string;
  /** Quote size variant */
  size?: Size;
  /** Visual style */
  variant?: 'default' | 'large' | 'minimal';
}

// =============================================================================
// Component
// =============================================================================

/**
 * QuoteBlock Component
 * 
 * Renders a styled block quote with optional attribution.
 * 
 * @param children - Quote text content
 * @param author - Quote author name
 * @param source - Source, date, or context
 * @param size - Text size (sm, md, lg)
 * @param variant - Visual style variant
 */
export function QuoteBlock({
  children,
  author,
  source,
  size = 'md',
  variant = 'default',
}: QuoteBlockProps): JSX.Element {
  // Size classes
  const sizeClass = {
    sm: 'quote-sm',
    md: 'quote-md',
    lg: 'quote-lg',
    full: 'quote-lg',
  }[size];
  
  const hasAttribution = author || source;
  
  return (
    <figure 
      className={`quote-block ${sizeClass} quote-${variant}`}
      data-variant={variant}
    >
      <blockquote className="quote-text">
        <span className="quote-mark quote-open">"</span>
        {children}
        <span className="quote-mark quote-close">"</span>
      </blockquote>
      
      {hasAttribution && (
        <figcaption className="quote-attribution">
          {author && <cite className="quote-author">— {author}</cite>}
          {source && <span className="quote-source">{source}</span>}
        </figcaption>
      )}
    </figure>
  );
}

// =============================================================================
// Exports
// =============================================================================

export default QuoteBlock;
