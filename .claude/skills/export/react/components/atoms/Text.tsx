/**
 * Text Component (L3 Atom)
 * 
 * Semantic text component for body content, captions, and code.
 * Supports different text variants for various content types.
 * 
 * Usage:
 * ```mdx
 * <Text>Regular paragraph text</Text>
 * <Text variant="lead">Larger introductory text</Text>
 * <Text variant="caption">Small caption text</Text>
 * <Text variant="code">Inline code text</Text>
 * ```
 */

import React, { type ReactNode } from 'react';
import type { TextVariant } from '@/utils/types';

// =============================================================================
// Types
// =============================================================================

export interface TextProps {
  children: ReactNode;
  /** Text variant */
  variant?: TextVariant;
}

// =============================================================================
// Component
// =============================================================================

/**
 * Text Component
 * 
 * Renders semantic text content with variant-based styling.
 * 
 * @param variant - Text variant (default, lead, caption, code)
 * @param children - Text content
 */
export function Text({
  children,
  variant = 'default',
}: TextProps): JSX.Element {
  const className = `text-${variant}`;
  
  // Code variant renders as <code> element
  if (variant === 'code') {
    return <code className={className}>{children}</code>;
  }
  
  // Caption variant for smaller text
  if (variant === 'caption') {
    return <span className={className}>{children}</span>;
  }
  
  // Default and lead variants render as <div> to avoid nesting issues with MDX's <p> tags
  return <div className={className}>{children}</div>;
}

// =============================================================================
// Exports
// =============================================================================

export default Text;
