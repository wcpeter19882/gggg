/**
 * Highlight Component (L3 Atom)
 * 
 * Inline highlight component for emphasizing key words or phrases within text.
 * Provides various highlight styles for different semantic purposes.
 * 
 * Usage:
 * ```mdx
 * <Text>Our product achieved <Highlight>10x growth</Highlight> this quarter.</Text>
 * <Text>This is <Highlight color="success">critically important</Highlight> information.</Text>
 * <Text>Key metrics: <Highlight color="primary">$1.2M revenue</Highlight></Text>
 * ```
 */

import React, { type ReactNode } from 'react';

// =============================================================================
// Types
// =============================================================================

export type HighlightColor = 'default' | 'primary' | 'success' | 'warning' | 'info' | 'accent';

export interface HighlightProps {
  children: ReactNode;
  /** Highlight color/style */
  color?: HighlightColor;
  /** Bold text */
  bold?: boolean;
}

// =============================================================================
// Component
// =============================================================================

/**
 * Highlight Component
 * 
 * Renders inline highlighted text with semantic color options.
 * Use to emphasize key terms, numbers, or important phrases within sentences.
 * 
 * @param color - Highlight color variant (default, primary, success, warning, info, accent)
 * @param bold - Whether text should be bold
 * @param children - Text content to highlight
 */
export function Highlight({
  children,
  color = 'default',
  bold = false,
}: HighlightProps): JSX.Element {
  const className = [
    'highlight',
    `highlight-${color}`,
    bold ? 'highlight-bold' : '',
  ].filter(Boolean).join(' ');
  
  return <mark className={className}>{children}</mark>;
}

// =============================================================================
// Exports
// =============================================================================

export default Highlight;
