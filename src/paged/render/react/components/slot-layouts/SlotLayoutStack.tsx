/**
 * SlotLayoutStack Component
 * 
 * A pure structural primitive for vertical stacking of content.
 * Part of the 4-Layer Architecture (Layer 3: SlotLayout).
 * 
 * This component handles ONLY the arrangement of children in a flex-column,
 * with configurable gap, alignment, and justification.
 * 
 * Usage:
 * ```tsx
 * <SlotLayoutStack gap="md" align="start">
 *   <Heading level={2}>Title</Heading>
 *   <Text>Content paragraph</Text>
 *   <SmartList items={[...]} />
 * </SlotLayoutStack>
 * ```
 */

import React, { type ReactNode } from 'react';

// =============================================================================
// Types
// =============================================================================

export type StackGap = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type StackAlign = 'start' | 'center' | 'end' | 'stretch';
export type StackJustify = 'start' | 'center' | 'end' | 'between';

export interface SlotLayoutStackProps {
  children: ReactNode;
  /** Gap between items (default: 'md') */
  gap?: StackGap;
  /** Horizontal alignment of items (default: 'stretch') */
  align?: StackAlign;
  /** Vertical justification/distribution (default: 'start') */
  justify?: StackJustify;
  /** Additional CSS class */
  className?: string;
}

// =============================================================================
// Gap Mapping (Tailwind-compatible spacing scale)
// =============================================================================

const gapClassMap: Record<StackGap, string> = {
  none: 'gap-0',
  xs: 'gap-1',    // 4px
  sm: 'gap-2',    // 8px
  md: 'gap-4',    // 16px
  lg: 'gap-6',    // 24px
  xl: 'gap-8',    // 32px
};

// =============================================================================
// Alignment Mapping
// =============================================================================

const alignClassMap: Record<StackAlign, string> = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
};

// =============================================================================
// Justification Mapping
// =============================================================================

const justifyClassMap: Record<StackJustify, string> = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
};

// =============================================================================
// Component
// =============================================================================

/**
 * SlotLayoutStack Component
 * 
 * Renders children in a vertical flex container with configurable spacing.
 * 
 * @param children - Content elements to stack vertically
 * @param gap - Space between items (default: 'md')
 * @param align - Horizontal alignment (default: 'stretch')
 * @param justify - Vertical distribution (default: 'start')
 * @param className - Additional CSS classes
 */
export function SlotLayoutStack({
  children,
  gap = 'md',
  align = 'stretch',
  justify = 'start',
  className = '',
}: SlotLayoutStackProps): JSX.Element {
  const gapClass = gapClassMap[gap];
  const alignClass = alignClassMap[align];
  const justifyClass = justifyClassMap[justify];

  return (
    <div
      className={`slot-layout-stack flex flex-col ${gapClass} ${alignClass} ${justifyClass} ${className}`.trim()}
      data-slot-layout="stack"
      data-gap={gap}
      data-align={align}
      data-justify={justify}
    >
      {children}
    </div>
  );
}

// =============================================================================
// Display Name (for debugging and compound component patterns)
// =============================================================================

SlotLayoutStack.displayName = 'SlotLayoutStack';

// =============================================================================
// Exports
// =============================================================================

export default SlotLayoutStack;
