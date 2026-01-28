'use client';

/**
 * Highlight - Shadow implementation for inline text highlighting
 * 
 * This is a custom component (not from Ant Design) that provides
 * semantic color variants for highlighting text inline.
 * 
 * Migrated from: .claude/skills/export/react/components/atoms/Highlight.tsx
 * 
 * Usage in SKILL.md:
 * ```mdx
 * <Text>Our product achieved <Highlight>10x growth</Highlight> this quarter.</Text>
 * <Text>This is <Highlight color="success">critically important</Highlight> information.</Text>
 * ```
 */

import React, { type ReactNode } from 'react';
import styles from './Highlight.module.css';

// =============================================================================
// Types
// =============================================================================

export type HighlightColor = 'default' | 'primary' | 'success' | 'warning' | 'info' | 'accent';

export interface HighlightProps {
  children: ReactNode;
  /** Highlight color variant */
  color?: HighlightColor;
  /** Bold text */
  strong?: boolean;
  /** Additional className */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * Highlight Component
 * 
 * Renders inline highlighted text with semantic color options.
 * Use to emphasize key terms, numbers, or important phrases within sentences.
 */
export function Highlight({
  children,
  color = 'default',
  strong = false,
  className = '',
}: HighlightProps): JSX.Element {
  const containerClass = [
    styles.highlight,
    styles[color],
    strong && styles.strong,
    className,
  ].filter(Boolean).join(' ');
  
  return <mark className={containerClass}>{children}</mark>;
}

export default Highlight;
